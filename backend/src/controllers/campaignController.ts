import { Response } from 'express';
import { AuthRequest } from '../types';
import { Campaign } from '../models/Campaign';
import { validateCampaign } from '../utils/validate';

export const createCampaign = async (req: AuthRequest, res: Response) => {
  const data = validateCampaign(req.body);
  const campaign = await Campaign.create({ ...data, brandId: req.user!.id, spent: 0 });
  res.status(201).json(campaign);
};

export const getBrandCampaigns = async (req: AuthRequest, res: Response) => {
  const campaigns = await Campaign.find({ brandId: req.user!.id }).sort({ createdAt: -1 });
  res.json(
    campaigns.map(c => ({
      ...c.toObject(),
      spentBudget: c.spent,
      remainingBudget: Math.max(0, c.totalBudget - c.spent),
    }))
  );
};

/** "Live" = the campaign still has budget left to pay out. */
export const getLiveCampaigns = async (_req: AuthRequest, res: Response) => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).populate('brandId', 'name');
  res.json(
    campaigns
      .filter(c => c.totalBudget - c.spent > 0)
      .map(c => ({ ...c.toObject(), remainingBudget: c.totalBudget - c.spent }))
  );
};
