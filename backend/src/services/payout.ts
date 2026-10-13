import { Milestone } from '../models/Campaign';

export function entitledPayout(milestones: Milestone[], views: number): number {
  let best = 0;
  let bestThreshold = -1;
  for (const m of milestones) {
    if (views >= m.views && m.views > bestThreshold) {
      best = m.payout;
      bestThreshold = m.views;
    }
  }
  return best;
}

export interface PayoutInput {
  milestones: Milestone[];
  views: number;
  alreadyPaid: number;
  remainingBudget: number;
}

export function computePayoutDelta({ milestones, views, alreadyPaid, remainingBudget }: PayoutInput): number {
  const entitled = entitledPayout(milestones, views);
  const owed = Math.max(0, entitled - alreadyPaid);
  return Math.min(owed, Math.max(0, remainingBudget));
}
