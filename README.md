# Meme'd Campaign Payout Tracker

A creator marketplace where **brands** create campaigns with a milestone payout ladder and **creators** submit posts and track earnings. Payouts are based on the highest milestone a post has crossed and can never exceed the campaign budget.

- **Live app (frontend, Vercel):** https://memed-campaign-tracker.vercel.app
- **Live API (backend, Render):** https://memed-campaign-tracker-backend.onrender.com (health check: https://memed-campaign-tracker-backend.onrender.com/health)

> The backend runs on Render's free tier, which sleeps when idle. The first request after a pause can take about a minute to respond.

## Stack
- **Backend:** Node.js, TypeScript, Express, MongoDB (Mongoose), JWT auth, Jest
- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Deploy targets:** MongoDB Atlas + Render (backend) + Vercel (frontend), or `docker compose`

## Project structure
```
backend/src
  config/       env loading
  models/       User, Campaign, Submission (Mongoose)
  services/     payout.ts (pure payout maths), viewsService.ts (race-safe update + earnings)
  controllers/  auth, campaign, submission
  middleware/   JWT auth + role guard, central error handler
  utils/        HttpError, input validation
  tests/        Jest unit tests
frontend/app    login, signup, /brand, /creator
```

## Setup
Requires Node 20+ and a MongoDB instance (local or Atlas).

```bash
# Backend
cd backend
cp .env.example .env        # then edit values
npm install
npm run dev                 # http://localhost:7000
npm test                    # Jest

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

### Docker
```bash
docker compose up --build   # mongo + backend :7000 + frontend :3000
```
`NEXT_PUBLIC_API_URL` is baked into the frontend at **build** time (see `docker-compose.yml` build args).

## Deployment
- **Database:** MongoDB Atlas (Network Access allows `0.0.0.0/0` so Render can connect).
- **Backend (Render):** Root Directory `backend`, Build `npm install --include=dev && npm run build`, Start `npm start`, Health Check Path `/health`. Environment: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (the Vercel URL, no trailing slash), `SPIKE_THRESHOLD`.
- **Frontend (Vercel):** Root Directory `frontend`, environment variable `NEXT_PUBLIC_API_URL=https://memed-campaign-tracker-backend.onrender.com/api`. It is inlined at build time, so redeploy after changing it.
- **CORS:** the backend allows `http://localhost:3000`, the Vercel URL above, and any origins listed in `CLIENT_URL`.

## Environment variables
| Variable | Where | Description |
|---|---|---|
| `PORT` | backend | API port (default 7000) |
| `MONGODB_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | Secret used to sign tokens. **Set a long random value in production** |
| `SPIKE_THRESHOLD` | backend | Views gained in a single update above which a submission is flagged (default 50000) |
| `CLIENT_URL` | backend | Comma-separated allowed frontend origins for CORS (empty = allow all, dev only) |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL including `/api` |

## API
| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/signup` | none | `{name,email,password,role}` -> `{token,user}` |
| `POST /api/auth/login` | none | `{email,password}` -> `{token,user}` |
| `POST /api/campaigns` | brand | Create campaign `{name,platform,totalBudget,milestones:[{views,payout}]}` |
| `GET /api/campaigns/brand` | brand | Own campaigns with `spentBudget` / `remainingBudget` |
| `GET /api/campaigns/live` | creator | Campaigns that still have budget left |
| `POST /api/submissions` | creator | `{campaignId,postUrl}` |
| `GET /api/submissions/creator` | creator | `{totalEarnings, submissions[]}` |
| `PATCH /api/submissions/:id/views` | none (per brief) | `{views}` simulates platform data and triggers payout |
| `GET /health` | none | Health check |

Errors return `{ "message": "..." }` with 400 (validation), 401/403 (auth), 404, or 409 (duplicate).

## How payouts work
1. `entitled` = payout of the highest milestone with `threshold <= views`.
2. `owed` = `entitled - alreadyPaid` (never negative).
3. `delta` = `min(owed, remainingBudget)`.
4. The campaign's `spent` and the submission's `paidOut` are updated atomically (see Concurrency).

## Assumptions / decisions where the brief was open
- **Crossing several milestones in one update** pays only the highest milestone (not a sum). Example: 0 -> 120K views pays the 100K payout.
- **Payout is cumulative, not additive:** a post that moves from 10K (paid 500) to 50K views is paid the *difference* (1,500), so the total equals the highest milestone.
- **Budget runs out mid-payout:** the creator receives whatever is left (a partial payout). If the budget is never topped up, they are not paid the remainder later. Once the budget is 0, further updates pay nothing.
- **Views never decrease:** an update with fewer views than already recorded is ignored (platform counters are treated as monotonic).
- **"Live" campaign** = a campaign with remaining budget > 0. Creators cannot submit to an exhausted campaign.
- **Ladder rules:** thresholds must be unique, payouts must strictly increase with views, and the top payout cannot exceed the total budget. The ladder is stored sorted.
- **A post URL can be submitted only once** (unique index), by any creator.
- **Money is stored as plain numbers (rupees).** Fractional paise are not specially handled.
- `PATCH /api/submissions/:id/views` has no role check, as specified.
- **Spike flag:** a submission is flagged when views increase by more than `SPIKE_THRESHOLD` in one update. The payout is still made; the flag is for review.

## Concurrency and double-pay protection
`services/viewsService.ts` avoids overspending and double-paying without locks:
1. Read the submission and campaign, compute `delta`.
2. **Reserve budget** with a conditional atomic update: `spent <= totalBudget - delta`, `$inc spent`. If it fails, re-read and retry.
3. **Claim the payout** with a compare-and-set on the submission: it only matches if `paidOut` is still the value that was read, so two simultaneous identical updates cannot both pay. If the claim fails, the reserved budget is released and the loop retries (up to 5 times, then 409).

Known limitation: the two writes are not in a multi-document transaction, so a process crash between step 2 and 3 could leave `spent` slightly ahead of `paidOut`. Using a MongoDB transaction (requires a replica set; Atlas has one) would close this gap.

## Tests
`npm test` (backend) runs Jest unit tests for payout calculation, the budget cap, idempotency, multi-milestone jumps, and input validation.

## Not implemented
Redis caching of the campaign list (optional bonus). See `SCALING.md` for the 10,000-creator scaling note.