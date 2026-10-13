import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { Submission } from '../models/Submission';
import { Campaign } from '../models/Campaign';
import { updateViews, creatorEarnings } from '../services/viewsService';
import { HttpError } from '../utils/errors';
import { requireObjectId, validatePostUrl, validateViews } from '../utils/validate';

export const submitPost = async (req: AuthRequest, res: Response) => {
  const campaignId = requireObjectId(req.body?.campaignId, 'campaignId');
  const postUrl = validatePostUrl(req.body?.postUrl);

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new HttpError(404, 'Campaign not found');
  if (campaign.totalBudget - campaign.spent <= 0) throw new HttpError(400, 'Campaign budget is exhausted');

  const submission = await Submission.create({ campaign: campaignId, creator: req.user!.id, postUrl });
  res.status(201).json(submission);
};

export const getCreatorSubmissions = async (req: AuthRequest, res: Response) => {
  const [totalEarnings, submissions] = await Promise.all([
    creatorEarnings(req.user!.id),
    Submission.find({ creator: req.user!.id }).sort({ createdAt: -1 }).populate('campaign', 'name platform'),
  ]);

  res.json({
    totalEarnings,
    submissions: submissions.map(s => {
      const obj: any = s.toObject();
      return { ...obj, campaignId: obj.campaign, currentPayout: obj.paidOut };
    }),
  });
};

/** Simulates platform data; intentionally has no role check (per the brief). */
export const patchViews = async (req: Request, res: Response) => {
  const id = requireObjectId(req.params.id, 'Submission id');
  const views = validateViews(req.body?.views);
  const submission = await updateViews(id, views);
  res.json({ submission });
};
