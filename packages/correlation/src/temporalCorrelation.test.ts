import { describe, it, expect } from 'vitest';
import { groupByTimeWindow } from './temporalCorrelation.js';
import type { AnomalyResult } from './anomaly.js';

function anomaly(service: string, timestamp: string, deltaPct = 200): AnomalyResult {
  return {
    service,
    metric: 'latency',
    timestamp,
    deltaPct,
    value: 1000,
    baseline: [100, 100, 100],
  };
}

describe('groupByTimeWindow', () => {
  it('returns empty array for empty input', () => {
    expect(groupByTimeWindow([])).toEqual([]);
  });

  it('puts a single anomaly into a single group', () => {
    const groups = groupByTimeWindow([anomaly('svc', '2026-10-27T10:00:00.000Z')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].anomalies).toHaveLength(1);
    expect(groups[0].windowStart).toBe('2026-10-27T10:00:00.000Z');
    expect(groups[0].windowEnd).toBe('2026-10-27T10:00:00.000Z');
  });

  it('groups anomalies within 60s into the same group', () => {
    const events = [
      anomaly('svc-a', '2026-10-27T10:00:00.000Z'),
      anomaly('svc-b', '2026-10-27T10:00:30.000Z'),
      anomaly('svc-c', '2026-10-27T10:00:59.000Z'),
    ];
    const groups = groupByTimeWindow(events, 60_000);
    expect(groups).toHaveLength(1);
    expect(groups[0].anomalies).toHaveLength(3);
    expect(groups[0].windowStart).toBe('2026-10-27T10:00:00.000Z');
    expect(groups[0].windowEnd).toBe('2026-10-27T10:00:59.000Z');
  });

  it('splits anomalies more than 60s apart into separate groups', () => {
    const events = [
      anomaly('svc-a', '2026-10-27T10:00:00.000Z'),
      anomaly('svc-b', '2026-10-27T10:01:01.000Z'), // 61s gap
    ];
    const groups = groupByTimeWindow(events, 60_000);
    expect(groups).toHaveLength(2);
    expect(groups[0].anomalies[0].service).toBe('svc-a');
    expect(groups[1].anomalies[0].service).toBe('svc-b');
  });

  it('handles unsorted input by sorting before grouping', () => {
    const events = [
      anomaly('svc-b', '2026-10-27T10:00:30.000Z'),
      anomaly('svc-a', '2026-10-27T10:00:00.000Z'),
    ];
    const groups = groupByTimeWindow(events, 60_000);
    expect(groups).toHaveLength(1);
    expect(groups[0].windowStart).toBe('2026-10-27T10:00:00.000Z');
  });
});
