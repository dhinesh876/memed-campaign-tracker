import mongoose, { Schema, Document } from 'mongoose';

export interface Milestone {
  views: number;
  payout: number;
}

export interface ICampaign extends Document {
  brandId: mongoose.Types.ObjectId;
  name: string;
  platform: 'Instagram' | 'YouTube';
  totalBudget: number;
  spent: number;
  milestones: Milestone[];
}

const MilestoneSchema = new Schema<Milestone>({
  views: { type: Number, required: true },
  payout: { type: Number, required: true },
}, { _id: false });

const CampaignSchema = new Schema<ICampaign>({
  brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  platform: { type: String, enum: ['Instagram', 'YouTube'], required: true },
  totalBudget: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  milestones: { type: [MilestoneSchema], required: true },
}, { timestamps: true });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
