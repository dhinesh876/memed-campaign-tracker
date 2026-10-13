import { entitledPayout, computePayoutDelta } from '../services/payout';
import { Milestone } from '../models/Campaign';

describe('Unit Tests: Payout Calculation & Budget Cap', () => {
  const ladder: Milestone[] = [
    { views: 10000, payout: 500 },
    { views: 50000, payout: 2000 },
    { views: 100000, payout: 5000 },
  ];

  test('entitledPayout returns 0 if under lowest threshold', () => {
    expect(entitledPayout(ladder, 4000)).toBe(0);
  });

  test('entitledPayout returns exact threshold payout', () => {
    expect(entitledPayout(ladder, 10000)).toBe(500);
  });

  test('entitledPayout skips lower milestones and rewards only highest crossed', () => {
    expect(entitledPayout(ladder, 75000)).toBe(2000);
    expect(entitledPayout(ladder, 150000)).toBe(5000);
  });

  test('computePayoutDelta pays only delta on progression (no double-pay)', () => {
    const delta = computePayoutDelta({
      milestones: ladder,
      views: 60000,
      alreadyPaid: 500,
      remainingBudget: 10000,
    });
    expect(delta).toBe(1500);
  });

  test('computePayoutDelta enforces partial payout when budget runs out', () => {
    const delta = computePayoutDelta({
      milestones: ladder,
      views: 120000,
      alreadyPaid: 2000,
      remainingBudget: 1200,
    });
    expect(delta).toBe(1200);
  });

  test('single update crossing several milestones pays only the highest one', () => {
    expect(computePayoutDelta({ milestones: ladder, views: 120000, alreadyPaid: 0, remainingBudget: 100000 })).toBe(5000);
  });

  test('ladder order does not matter', () => {
    expect(entitledPayout([...ladder].reverse(), 60000)).toBe(2000);
  });

  test('repeated update with the same views pays 0', () => {
    expect(computePayoutDelta({ milestones: ladder, views: 60000, alreadyPaid: 2000, remainingBudget: 10000 })).toBe(0);
  });

  test('zero or negative remaining budget pays 0', () => {
    expect(computePayoutDelta({ milestones: ladder, views: 60000, alreadyPaid: 0, remainingBudget: 0 })).toBe(0);
    expect(computePayoutDelta({ milestones: ladder, views: 60000, alreadyPaid: 0, remainingBudget: -50 })).toBe(0);
  });

  test('payout never exceeds remaining budget (budget cap)', () => {
    for (const remaining of [0, 1, 499, 500, 2500, 99999]) {
      const d = computePayoutDelta({ milestones: ladder, views: 500000, alreadyPaid: 0, remainingBudget: remaining });
      expect(d).toBeLessThanOrEqual(remaining);
    }
  });
});
