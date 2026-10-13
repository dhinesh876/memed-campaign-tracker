import mongoose, { Schema, Document } from 'mongoose';

export interface SubmissionDoc extends Document {
  campaign: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  postUrl: string;
  views: number;
  paidOut: number;
  flagged?: boolean;
  flagReason?: string;
}

const SubmissionSchema = new Schema<SubmissionDoc>({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postUrl: { type: String, required: true },
  views: { type: Number, default: 0 },
  paidOut: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String },
}, { timestamps: true });

// A post link can only be submitted once; also speeds up per-creator / per-campaign lookups.
SubmissionSchema.index({ postUrl: 1 }, { unique: true });
SubmissionSchema.index({ creator: 1 });
SubmissionSchema.index({ campaign: 1 });

export const Submission = mongoose.model<SubmissionDoc>('Submission', SubmissionSchema);
