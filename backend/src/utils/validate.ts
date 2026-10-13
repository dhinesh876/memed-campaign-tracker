import { Types } from 'mongoose';
import { HttpError } from './errors';
import { Milestone } from '../models/Campaign';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MILESTONES = 50;
const MAX_VIEWS = 1_000_000_000_000;

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export function requireObjectId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value) || new Types.ObjectId(value).toHexString() !== value) {
    throw new HttpError(400, `${label} is not a valid id`);
  }
  return value;
}

export function validateSignup(body: any) {
  const { name, email, password, role } = body ?? {};
  if (!isNonEmptyString(name)) throw new HttpError(400, 'Name is required');
  if (!isNonEmptyString(email) || !EMAIL_RE.test(email.trim())) throw new HttpError(400, 'A valid email is required');
  if (typeof password !== 'string' || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  if (role !== 'brand' && role !== 'creator') throw new HttpError(400, 'Role must be "brand" or "creator"');
  return { name: name.trim(), email: email.trim().toLowerCase(), password, role: role as 'brand' | 'creator' };
}

export function validateLogin(body: any) {
  const { email, password } = body ?? {};
  if (!isNonEmptyString(email) || typeof password !== 'string' || password.length === 0) {
    throw new HttpError(400, 'Email and password are required');
  }
  return { email: email.trim().toLowerCase(), password };
}

/** Validates the ladder and returns it sorted ascending by view threshold. */
export function validateMilestones(raw: unknown, totalBudget: number): Milestone[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new HttpError(400, 'At least one milestone is required');
  if (raw.length > MAX_MILESTONES) throw new HttpError(400, `At most ${MAX_MILESTONES} milestones are allowed`);

  const ladder: Milestone[] = raw.map((m, i) => {
    const views = Number(m?.views);
    const payout = Number(m?.payout);
    if (!Number.isInteger(views) || views <= 0) throw new HttpError(400, `Milestone ${i + 1}: views must be a positive whole number`);
    if (!Number.isFinite(payout) || payout <= 0) throw new HttpError(400, `Milestone ${i + 1}: payout must be a positive number`);
    return { views, payout };
  });

  ladder.sort((a, b) => a.views - b.views);
  for (let i = 1; i < ladder.length; i++) {
    if (ladder[i].views === ladder[i - 1].views) throw new HttpError(400, 'Milestone view thresholds must be unique');
    if (ladder[i].payout <= ladder[i - 1].payout) throw new HttpError(400, 'Payouts must increase with view thresholds');
  }
  if (ladder[ladder.length - 1].payout > totalBudget) {
    throw new HttpError(400, 'A milestone payout cannot exceed the total campaign budget');
  }
  return ladder;
}

export function validateCampaign(body: any) {
  const { name, platform, totalBudget, milestones } = body ?? {};
  if (!isNonEmptyString(name)) throw new HttpError(400, 'Campaign name is required');
  if (platform !== 'Instagram' && platform !== 'YouTube') throw new HttpError(400, 'Platform must be "Instagram" or "YouTube"');
  const budget = Number(totalBudget);
  if (totalBudget === undefined || totalBudget === null || totalBudget === '' || !Number.isFinite(budget) || budget <= 0) {
    throw new HttpError(400, 'Total budget must be a positive number');
  }
  return {
    name: name.trim(),
    platform: platform as 'Instagram' | 'YouTube',
    totalBudget: budget,
    milestones: validateMilestones(milestones, budget),
  };
}

export function validatePostUrl(value: unknown): string {
  if (!isNonEmptyString(value)) throw new HttpError(400, 'Post URL is required');
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new HttpError(400, 'Post URL is not a valid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new HttpError(400, 'Post URL must start with http:// or https://');
  return url.toString();
}

export function validateViews(value: unknown): number {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > MAX_VIEWS) {
    throw new HttpError(400, 'views must be a non-negative whole number');
  }
  return n;
}
