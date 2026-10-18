import { describe, it, expect } from 'vitest';
import { percentDelta, mean, isAnomalous } from './index.js';

describe('percentDelta', () => {
  it('computes percent change', () => {
    expect(percentDelta(150, 100)).toBeCloseTo(50);
    expect(percentDelta(50, 100)).toBeCloseTo(-50);
  });

  it('handles a zero baseline', () => {
    expect(percentDelta(0, 0)).toBe(0);
    expect(percentDelta(5, 0)).toBe(Infinity);
  });
});

describe('mean', () => {
  it('averages a series and returns 0 for empty', () => {
    expect(mean([10, 20, 30])).toBe(20);
    expect(mean([])).toBe(0);
  });
});

describe('isAnomalous', () => {
  it('flags large deviations from the rolling baseline', () => {
    const baseline = [300, 310, 290, 305];
    expect(isAnomalous(1240, baseline).anomalous).toBe(true);
  });

  it('ignores normal variation', () => {
    const baseline = [300, 310, 290, 305];
    expect(isAnomalous(320, baseline).anomalous).toBe(false);
  });
});
