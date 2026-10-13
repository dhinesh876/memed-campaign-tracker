import { Types } from 'mongoose';
import { Campaign } from '../models/Campaign';
import { Submission, SubmissionDoc } from '../models/Submission';
import { env } from '../config/env';
import { HttpError } from '../utils/errors';
import { computePayoutDelta } from './payout';

const MAX_RETRIES = 5;

export async function updateViews(submissionId: string, views: number): Promise<SubmissionDoc> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const submission = await Submission.findById(submissionId);
    if (!submission) throw new HttpError(404, 'Submission not found');
    const campaign = await Campaign.findById(submission.campaign);
    if (!campaign) throw new HttpError(404, 'Campaign not found');

    const newViews = Math.max(views, submission.views);
    const delta = computePayoutDelta({
      milestones: campaign.milestones,
      views: newViews,
      alreadyPaid: submission.paidOut,
      remainingBudget: campaign.totalBudget - campaign.spent,
    });

    const spike = newViews - submission.views > env.spikeViewsThreshold;
    const flagFields = spike
      ? { flagged: true, flagReason: `Views jumped by ${newViews - submission.views} in one update` }
      : {};

    if (delta === 0) {
      const updated = await Submission.findOneAndUpdate(
        { _id: submission._id },
        { $max: { views: newViews }, ...(spike ? { $set: flagFields } : {}) },
        { new: true }
      );
      return updated!.toObject();
    }

    const reserved = await Campaign.findOneAndUpdate(
      { _id: campaign._id, spent: { $lte: campaign.totalBudget - delta } },
      { $inc: { spent: delta } }
    );
    if (!reserved) continue;

    const claimed = await Submission.findOneAndUpdate(
      { _id: submission._id, paidOut: submission.paidOut },
      { $set: { views: newViews, ...flagFields }, $inc: { paidOut: delta } },
      { new: true }
    );
    if (claimed) return claimed.toObject();

    await Campaign.updateOne({ _id: campaign._id }, { $inc: { spent: -delta } });
  }
  throw new HttpError(409, 'Could not apply update due to heavy concurrency, please retry');
}

export async function creatorEarnings(creatorId: string): Promise<number> {
  const [row] = await Submission.aggregate<{ total: number }>([
    { $match: { creator: new Types.ObjectId(creatorId) } },
    { $group: { _id: null, total: { $sum: '$paidOut' } } },
  ]);
  return row?.total ?? 0;
}
