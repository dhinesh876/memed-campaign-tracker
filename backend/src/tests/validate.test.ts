import { validateCampaign, validateMilestones, validatePostUrl, validateViews, validateSignup, requireObjectId } from '../utils/validate';
import { HttpError } from '../utils/errors';

const expect400 = (fn: () => unknown) => {
  try { fn(); } catch (e) { expect(e).toBeInstanceOf(HttpError); expect((e as HttpError).status).toBe(400); return; }
  throw new Error('expected HttpError 400');
};

describe('Input validation', () => {
  const ladder = [{ views: 50000, payout: 2000 }, { views: 10000, payout: 500 }];

  test('milestones are sorted ascending', () => {
    expect(validateMilestones(ladder, 5000).map(m => m.views)).toEqual([10000, 50000]);
  });
  test('rejects empty / non-array ladder', () => {
    expect400(() => validateMilestones([], 1000));
    expect400(() => validateMilestones(undefined, 1000));
  });
  test('rejects duplicate thresholds and non-increasing payouts', () => {
    expect400(() => validateMilestones([{ views: 10, payout: 5 }, { views: 10, payout: 6 }], 100));
    expect400(() => validateMilestones([{ views: 10, payout: 50 }, { views: 20, payout: 40 }], 100));
  });
  test('rejects payout larger than the whole budget', () => {
    expect400(() => validateMilestones([{ views: 10, payout: 999 }], 100));
  });
  test('campaign: rejects bad platform, negative budget', () => {
    const ok = { name: 'A', platform: 'Instagram', totalBudget: 1000, milestones: [{ views: 10, payout: 5 }] };
    expect(validateCampaign(ok).totalBudget).toBe(1000);
    expect400(() => validateCampaign({ ...ok, platform: 'TikTok' }));
    expect400(() => validateCampaign({ ...ok, totalBudget: -5 }));
    expect400(() => validateCampaign({ ...ok, name: '  ' }));
  });
  test('views must be a non-negative integer', () => {
    expect(validateViews(0)).toBe(0);
    expect(validateViews('120')).toBe(120);
    [-1, 1.5, 'abc', undefined, null, NaN].forEach(v => expect400(() => validateViews(v)));
  });
  test('post URL must be http(s)', () => {
    expect(validatePostUrl('https://instagram.com/p/abc')).toContain('instagram.com');
    expect400(() => validatePostUrl('not a url'));
    expect400(() => validatePostUrl('javascript:alert(1)'));
  });
  test('signup validation', () => {
    expect(validateSignup({ name: 'A', email: 'A@B.com', password: 'secret1', role: 'brand' }).email).toBe('a@b.com');
    expect400(() => validateSignup({ name: 'A', email: 'A@B.com', role: 'brand' }));
    expect400(() => validateSignup({ name: 'A', email: 'bad', password: 'secret1', role: 'brand' }));
    expect400(() => validateSignup({ name: 'A', email: 'a@b.com', password: 'secret1', role: 'admin' }));
  });
  test('object id check', () => {
    expect(requireObjectId('507f1f77bcf86cd799439011', 'id')).toBeTruthy();
    expect400(() => requireObjectId('nope', 'id'));
    expect400(() => requireObjectId('123456789012', 'id'));
  });
});
