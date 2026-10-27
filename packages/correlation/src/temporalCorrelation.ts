import type { AnomalyResult } from './anomaly.js';

export interface AnomalyGroup {
  windowStart: string;
  windowEnd: string;
  anomalies: AnomalyResult[];
}

export function groupByTimeWindow(
  anomalies: AnomalyResult[],
  windowMs = 60_000,
): AnomalyGroup[] {
  if (anomalies.length === 0) return [];

  const sorted = [...anomalies].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );

  const groups: AnomalyGroup[] = [];
  let current: AnomalyGroup = {
    windowStart: sorted[0].timestamp,
    windowEnd: sorted[0].timestamp,
    anomalies: [sorted[0]],
  };

  for (let i = 1; i < sorted.length; i++) {
    const prev = Date.parse(sorted[i - 1].timestamp);
    const curr = Date.parse(sorted[i].timestamp);

    if (curr - prev > windowMs) {
      groups.push(current);
      current = {
        windowStart: sorted[i].timestamp,
        windowEnd: sorted[i].timestamp,
        anomalies: [sorted[i]],
      };
    } else {
      current.anomalies.push(sorted[i]);
      current.windowEnd = sorted[i].timestamp;
    }
  }

  groups.push(current);
  return groups;
}
