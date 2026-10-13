# Scaling to 10,000 creators

**Where it hurts first.** Views updates are write-heavy, and every payout touches the same *campaign* document (`spent`). A popular campaign becomes a hot document, and the read-compute-reserve-claim loop will retry more as contention grows.

**1. Queue the writes.** Put view updates on a queue (SQS, BullMQ/Redis, Kafka) and process them with workers, partitioned by `campaignId`. One partition is handled by one worker at a time, so a campaign's payouts become effectively serial and lock contention disappears. The API just validates and enqueues, returning 202 quickly.

**2. Cut write amplification.** Platform view counts arrive constantly but payouts only change at milestone crossings. Workers should compare the new views to the next milestone threshold in memory and skip any database write that cannot change a payout.

**3. Remove the hot document.** Shard the budget: pre-allocate a slice of the campaign budget to each worker/partition and let it spend from its slice, rebalancing when a slice runs out. Alternatively keep an append-only `payouts` ledger and compute `spent` as a rollup, so the budget check is the only contended step.

**4. Make money changes durable and auditable.** Move to a ledger (one immutable row per payout, with an idempotency key of `submissionId + milestone`) and use MongoDB transactions so `spent` and `paidOut` can never drift. This also gives finance a full audit trail.

**5. Reads.** Cache the creator-facing campaign list in Redis with a short TTL and invalidate on campaign creation or budget exhaustion. Serve dashboards from secondary replicas. Add indexes on `Submission.creator`, `Submission.campaign` and `Campaign.brandId` and paginate list endpoints.

**6. Operations.** Run the API statelessly behind a load balancer, add rate limiting on auth and the views endpoint, and replace the open views endpoint with signed webhooks or a poller that talks to the Instagram/YouTube APIs.
