# Correlation & Incident Intelligence Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the correlation & incident intelligence engine inside `packages/correlation` — anomaly detection, temporal/service correlation, incident assembly, and candidate ranking.

**Architecture:** Five focused modules (`anomaly.ts`, `temporalCorrelation.ts`, `serviceCorrelation.ts`, `whatChanged.ts`, `incidentFactory.ts`) each with a single responsibility, communicating through plain typed data. The existing `index.ts` helpers (`isAnomalous`, `percentDelta`, `mean`) are untouched; new modules build on them. `index.ts` is extended to re-export the new public API.

**Tech Stack:** TypeScript (strict, NodeNext modules), Vitest for tests, `@tracelens/shared` for `TelemetryEvent`, `Incident`, `ChangeEvent`, `confidenceFromScore` types/helpers.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `packages/correlation/src/anomaly.ts` | Rolling-baseline anomaly detector |
| Create | `packages/correlation/src/anomaly.test.ts` | Unit tests for anomaly detector |
| Create | `packages/correlation/src/temporalCorrelation.ts` | Group anomalies by time window |
| Create | `packages/correlation/src/temporalCorrelation.test.ts` | Unit tests for temporal grouping |
| Create | `packages/correlation/src/serviceCorrelation.ts` | Extract co-anomalous service names |
| Create | `packages/correlation/src/serviceCorrelation.test.ts` | Unit tests for service correlation |
| Create | `packages/correlation/src/whatChanged.ts` | Collect change events within a window |
| Create | `packages/correlation/src/whatChanged.test.ts` | Unit tests for change collection |
| Create | `packages/correlation/src/incidentFactory.ts` | Assemble Incident from correlated data |
| Create | `packages/correlation/src/incidentFactory.test.ts` | Unit + injected-incident integration test |
| Modify | `packages/correlation/src/index.ts` | Re-export new public API |
| Create | `docs/CORRELATION.md` | Algorithm docs |

---

## Task 1: Rolling-Baseline Anomaly Detector

**Files:**
- Create: `packages/correlation/src/anomaly.test.ts`
- Create: `packages/correlation/src/anomaly.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/correlation/src/anomaly.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { detectAnomalies } from './anomaly.js';
import type { TelemetryEvent } from '@tracelens/shared';

function metricEvent(
  service: string,
  name: string,
  value: number,
  timestamp: string,
): TelemetryEvent {
  return { type: 'metric', service, name, value, timestamp };
}

describe('detectAnomalies', () => {
  it('returns empty array for empty input', () => {
    expect(detectAnomalies([])).toEqual([]);
  });

  it('returns empty array when no anomalies exist', () => {
    const events: TelemetryEvent[] = [
      metricEvent('svc-a', 'latency', 100, '2026-10-27T10:00:00.000Z'),
      metricEvent('svc-a', 'latency', 102, '2026-10-27T10:00:01.000Z'),
      metricEvent('svc-a', 'latency', 98,  '2026-10-27T10:00:02.000Z'),
      metricEvent('svc-a', 'latency', 101, '2026-10-27T10:00:03.000Z'),
      metricEvent('svc-a', 'latency', 99,  '2026-10-27T10:00:04.000Z'),
      metricEvent('svc-a', 'latency', 103, '2026-10-27T10:00:05.000Z'),
    ];
    expect(detectAnomalies(events)).toEqual([]);
  });

  it('detects a spike anomaly using the sliding window', () => {
    const baseline = [
      metricEvent('payment', 'latency', 300, '2026-10-27T10:00:00.000Z'),
      metricEvent('payment', 'latency', 310, '2026-10-27T10:00:01.000Z'),
      metricEvent('payment', 'latency', 290, '2026-10-27T10:00:02.000Z'),
      metricEvent('payment', 'latency', 305, '2026-10-27T10:00:03.000Z'),
    ];
    const spike = metricEvent('payment', 'latency', 1240, '2026-10-27T10:00:04.000Z');
    const results = detectAnomalies([...baseline, spike], 4);
    expect(results).toHaveLength(1);
    expect(results[0].service).toBe('payment');
    expect(results[0].metric).toBe('latency');
    expect(results[0].value).toBe(1240);
    expect(results[0].deltaPct).toBeGreaterThan(300);
    expect(results[0].baseline).toEqual([300, 310, 290, 305]);
  });

  it('ignores non-metric events', () => {
    const events: TelemetryEvent[] = [
      { type: 'deploy', service: 'payment', name: 'deployment', timestamp: '2026-10-27T10:00:00.000Z' },
      { type: 'log',    service: 'payment', name: 'error',      timestamp: '2026-10-27T10:00:01.000Z' },
    ];
    expect(detectAnomalies(events)).toEqual([]);
  });

  it('tracks separate series per (service, metric) pair', () => {
    const baselineA = [
      metricEvent('svc-a', 'latency', 100, '2026-10-27T10:00:00.000Z'),
      metricEvent('svc-a', 'latency', 100, '2026-10-27T10:00:01.000Z'),
      metricEvent('svc-a', 'latency', 100, '2026-10-27T10:00:02.000Z'),
    ];
    const baselineB = [
      metricEvent('svc-b', 'latency', 200, '2026-10-27T10:00:00.000Z'),
      metricEvent('svc-b', 'latency', 200, '2026-10-27T10:00:01.000Z'),
      metricEvent('svc-b', 'latency', 200, '2026-10-27T10:00:02.000Z'),
    ];
    const spikeA = metricEvent('svc-a', 'latency', 999, '2026-10-27T10:00:03.000Z');
    const normalB = metricEvent('svc-b', 'latency', 210, '2026-10-27T10:00:03.000Z');
    const results = detectAnomalies([...baselineA, ...baselineB, spikeA, normalB], 3);
    expect(results).toHaveLength(1);
    expect(results[0].service).toBe('svc-a');
  });

  it('does not flag a point before the window is full', () => {
    // Only 2 points before the potential anomaly, windowSize=4 → skip
    const events: TelemetryEvent[] = [
      metricEvent('svc', 'cpu', 10, '2026-10-27T10:00:00.000Z'),
      metricEvent('svc', 'cpu', 10, '2026-10-27T10:00:01.000Z'),
      metricEvent('svc', 'cpu', 999, '2026-10-27T10:00:02.000Z'),
    ];
    expect(detectAnomalies(events, 4)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/I578280/Desktop/Tracelens
npm test -- --reporter=verbose packages/correlation/src/anomaly.test.ts
```

Expected: FAIL — `Cannot find module './anomaly.js'`

- [ ] **Step 3: Implement `anomaly.ts`**

Create `packages/correlation/src/anomaly.ts`:

```ts
import type { TelemetryEvent } from '@tracelens/shared';
import { isAnomalous } from './index.js';

export interface AnomalyResult {
  service: string;
  metric: string;
  timestamp: string;
  deltaPct: number;
  value: number;
  baseline: number[];
}

export function detectAnomalies(
  events: TelemetryEvent[],
  windowSize = 10,
  thresholdPct = 50,
): AnomalyResult[] {
  const series = new Map<string, number[]>();
  const results: AnomalyResult[] = [];

  for (const event of events) {
    if (event.type !== 'metric' || event.value === undefined) continue;

    const key = `${event.service}::${event.name}`;
    const window = series.get(key) ?? [];

    if (window.length >= windowSize) {
      const { anomalous, deltaPct } = isAnomalous(event.value, window, thresholdPct);
      if (anomalous) {
        results.push({
          service: event.service,
          metric: event.name,
          timestamp: event.timestamp,
          deltaPct,
          value: event.value,
          baseline: [...window],
        });
      }
    }

    window.push(event.value);
    if (window.length > windowSize) window.shift();
    series.set(key, window);
  }

  return results;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose packages/correlation/src/anomaly.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/correlation/src/anomaly.ts packages/correlation/src/anomaly.test.ts
git commit -m "feat(correlation): add rolling-baseline anomaly detector"
```

---

## Task 2: Temporal Correlation — Group by Time Window

**Files:**
- Create: `packages/correlation/src/temporalCorrelation.test.ts`
- Create: `packages/correlation/src/temporalCorrelation.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/correlation/src/temporalCorrelation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose packages/correlation/src/temporalCorrelation.test.ts
```

Expected: FAIL — `Cannot find module './temporalCorrelation.js'`

- [ ] **Step 3: Implement `temporalCorrelation.ts`**

Create `packages/correlation/src/temporalCorrelation.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose packages/correlation/src/temporalCorrelation.test.ts
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/correlation/src/temporalCorrelation.ts packages/correlation/src/temporalCorrelation.test.ts
git commit -m "feat(correlation): add temporal correlation — group anomalies by time window"
```

---

## Task 3: Service Correlation — Co-Anomalous Service Set

**Files:**
- Create: `packages/correlation/src/serviceCorrelation.test.ts`
- Create: `packages/correlation/src/serviceCorrelation.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/correlation/src/serviceCorrelation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { findCoAnomalousServices } from './serviceCorrelation.js';
import type { AnomalyGroup } from './temporalCorrelation.js';
import type { AnomalyResult } from './anomaly.js';

function anomaly(service: string): AnomalyResult {
  return {
    service,
    metric: 'latency',
    timestamp: '2026-10-27T10:00:00.000Z',
    deltaPct: 200,
    value: 1000,
    baseline: [100],
  };
}

function group(anomalies: AnomalyResult[]): AnomalyGroup {
  return {
    windowStart: '2026-10-27T10:00:00.000Z',
    windowEnd: '2026-10-27T10:00:30.000Z',
    anomalies,
  };
}

describe('findCoAnomalousServices', () => {
  it('returns empty array for a group with no anomalies', () => {
    expect(findCoAnomalousServices(group([]))).toEqual([]);
  });

  it('returns the single service for a single-anomaly group', () => {
    expect(findCoAnomalousServices(group([anomaly('payment')]))).toEqual(['payment']);
  });

  it('returns all services in a multi-service group', () => {
    const services = findCoAnomalousServices(
      group([anomaly('payment'), anomaly('auth'), anomaly('cart')]),
    );
    expect(services.sort()).toEqual(['auth', 'cart', 'payment']);
  });

  it('deduplicates services with multiple anomalies', () => {
    const services = findCoAnomalousServices(
      group([anomaly('payment'), anomaly('payment'), anomaly('auth')]),
    );
    expect(services.sort()).toEqual(['auth', 'payment']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose packages/correlation/src/serviceCorrelation.test.ts
```

Expected: FAIL — `Cannot find module './serviceCorrelation.js'`

- [ ] **Step 3: Implement `serviceCorrelation.ts`**

Create `packages/correlation/src/serviceCorrelation.ts`:

```ts
import type { AnomalyGroup } from './temporalCorrelation.js';

export function findCoAnomalousServices(group: AnomalyGroup): string[] {
  return [...new Set(group.anomalies.map((a) => a.service))];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose packages/correlation/src/serviceCorrelation.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/correlation/src/serviceCorrelation.ts packages/correlation/src/serviceCorrelation.test.ts
git commit -m "feat(correlation): add service correlation — identify co-anomalous services"
```

---

## Task 4: What Changed — Collect Change Events

**Files:**
- Create: `packages/correlation/src/whatChanged.test.ts`
- Create: `packages/correlation/src/whatChanged.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/correlation/src/whatChanged.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { collectChanges } from './whatChanged.js';
import type { TelemetryEvent } from '@tracelens/shared';

function event(type: TelemetryEvent['type'], timestamp: string, name = 'deploy-v4'): TelemetryEvent {
  return { type, service: 'payment', name, timestamp };
}

describe('collectChanges', () => {
  const windowStart = '2026-10-27T10:00:00.000Z';
  const windowEnd   = '2026-10-27T10:01:00.000Z';

  it('returns empty array when no events provided', () => {
    expect(collectChanges([], windowStart, windowEnd)).toEqual([]);
  });

  it('collects deploy events within the window', () => {
    const changes = collectChanges(
      [event('deploy', '2026-10-27T10:00:30.000Z')],
      windowStart,
      windowEnd,
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].at).toBe('2026-10-27T10:00:30.000Z');
    expect(changes[0].text).toContain('deploy-v4');
  });

  it('collects config_change events within the window', () => {
    const changes = collectChanges(
      [event('config_change', '2026-10-27T10:00:45.000Z', 'feature-flag-update')],
      windowStart,
      windowEnd,
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].text).toContain('feature-flag-update');
  });

  it('excludes metric, log, and trace events', () => {
    const changes = collectChanges(
      [
        event('metric', '2026-10-27T10:00:30.000Z'),
        event('log',    '2026-10-27T10:00:31.000Z'),
        event('trace',  '2026-10-27T10:00:32.000Z'),
      ],
      windowStart,
      windowEnd,
    );
    expect(changes).toEqual([]);
  });

  it('excludes events outside the window', () => {
    const changes = collectChanges(
      [
        event('deploy', '2026-10-27T09:59:59.000Z'), // before
        event('deploy', '2026-10-27T10:01:01.000Z'), // after
      ],
      windowStart,
      windowEnd,
    );
    expect(changes).toEqual([]);
  });

  it('includes events exactly on the window boundaries', () => {
    const changes = collectChanges(
      [
        event('deploy', windowStart),
        event('deploy', windowEnd),
      ],
      windowStart,
      windowEnd,
    );
    expect(changes).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose packages/correlation/src/whatChanged.test.ts
```

Expected: FAIL — `Cannot find module './whatChanged.js'`

- [ ] **Step 3: Implement `whatChanged.ts`**

Create `packages/correlation/src/whatChanged.ts`:

```ts
import type { TelemetryEvent, ChangeEvent } from '@tracelens/shared';

export function collectChanges(
  events: TelemetryEvent[],
  windowStart: string,
  windowEnd: string,
): ChangeEvent[] {
  const start = Date.parse(windowStart);
  const end   = Date.parse(windowEnd);

  return events
    .filter((e) => {
      if (e.type !== 'deploy' && e.type !== 'config_change') return false;
      const t = Date.parse(e.timestamp);
      return t >= start && t <= end;
    })
    .map((e) => ({
      at: e.timestamp,
      text: `${e.type}: ${e.name} on ${e.service}`,
    }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose packages/correlation/src/whatChanged.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/correlation/src/whatChanged.ts packages/correlation/src/whatChanged.test.ts
git commit -m "feat(correlation): add whatChanged — collect deploy/config_change events in window"
```

---

## Task 5: Incident Factory — Assemble Incident

**Files:**
- Create: `packages/correlation/src/incidentFactory.test.ts`
- Create: `packages/correlation/src/incidentFactory.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/correlation/src/incidentFactory.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildIncident } from './incidentFactory.js';
import type { AnomalyGroup } from './temporalCorrelation.js';
import type { AnomalyResult } from './anomaly.js';
import type { ChangeEvent } from '@tracelens/shared';

function anomaly(
  service: string,
  timestamp: string,
  deltaPct: number,
  metric = 'latency',
): AnomalyResult {
  return { service, metric, timestamp, deltaPct, value: 1000, baseline: [100] };
}

function group(anomalies: AnomalyResult[]): AnomalyGroup {
  const sorted = [...anomalies].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );
  return {
    windowStart: sorted[0].timestamp,
    windowEnd: sorted[sorted.length - 1].timestamp,
    anomalies: sorted,
  };
}

describe('buildIncident', () => {
  it('assembles an incident with the correct shape', () => {
    const g = group([anomaly('payment', '2026-10-27T10:00:00.000Z', 200)]);
    const inc = buildIncident(g, ['payment'], [], 'INC-001');
    expect(inc.id).toBe('INC-001');
    expect(inc.affectedServices).toEqual(['payment']);
    expect(inc.candidates).toHaveLength(1);
    expect(inc.signals).toHaveLength(1);
  });

  it('derives severity from the highest deltaPct', () => {
    expect(
      buildIncident(group([anomaly('s', '2026-10-27T10:00:00.000Z', 250)]), ['s'], []).severity,
    ).toBe('critical');
    expect(
      buildIncident(group([anomaly('s', '2026-10-27T10:00:00.000Z', 150)]), ['s'], []).severity,
    ).toBe('high');
    expect(
      buildIncident(group([anomaly('s', '2026-10-27T10:00:00.000Z', 75)]), ['s'], []).severity,
    ).toBe('medium');
    expect(
      buildIncident(group([anomaly('s', '2026-10-27T10:00:00.000Z', 30)]), ['s'], []).severity,
    ).toBe('low');
  });

  it('orders timeline entries by timestamp ascending', () => {
    const changes: ChangeEvent[] = [
      { at: '2026-10-27T10:00:05.000Z', text: 'deploy v2' },
    ];
    const g = group([
      anomaly('payment', '2026-10-27T10:00:10.000Z', 200),
      anomaly('auth',    '2026-10-27T10:00:00.000Z', 200),
    ]);
    const inc = buildIncident(g, ['payment', 'auth'], changes);
    const times = inc.timeline.map((e) => e.at);
    expect(times).toEqual([...times].sort());
  });

  it('ranks candidates by earliest onset', () => {
    const g = group([
      anomaly('cart',    '2026-10-27T10:00:30.000Z', 200),
      anomaly('payment', '2026-10-27T10:00:00.000Z', 200),
      anomaly('auth',    '2026-10-27T10:00:15.000Z', 200),
    ]);
    const inc = buildIncident(g, ['cart', 'payment', 'auth'], []);
    expect(inc.candidates[0].component).toBe('payment');
    expect(inc.candidates[1].component).toBe('auth');
    expect(inc.candidates[2].component).toBe('cart');
  });

  it('gives top candidate confidence=high and "First service" in why', () => {
    const g = group([
      anomaly('payment', '2026-10-27T10:00:00.000Z', 312),
      anomaly('auth',    '2026-10-27T10:00:30.000Z', 200),
    ]);
    const inc = buildIncident(g, ['payment', 'auth'], []);
    expect(inc.candidates[0].confidence).toBe('high');
    expect(inc.candidates[0].why.some((w) => w.includes('First service'))).toBe(true);
  });

  // ── Injected-incident integration test ──────────────────────────────────
  it('known injected incident: payment-service is top candidate', () => {
    const T0  = '2026-10-27T14:00:00.000Z'; // payment — T+0
    const T15 = '2026-10-27T14:00:15.000Z'; // auth     — T+15s
    const T30 = '2026-10-27T14:00:30.000Z'; // cart     — T+30s

    const g = group([
      anomaly('cart',    T30, 150, 'http.latency'),
      anomaly('payment', T0,  312, 'http.latency'),
      anomaly('auth',    T15, 200, 'http.latency'),
    ]);

    const inc = buildIncident(
      g,
      ['cart', 'payment', 'auth'],
      [],
      'INC-INJECTED',
    );

    // Top candidate is payment-service (earliest onset)
    expect(inc.candidates[0].component).toBe('payment');
    // Confidence should be high (score ≈ 1.0 for earliest)
    expect(inc.candidates[0].confidence).toBe('high');
    // why[] contains the spike description and "First service" marker
    expect(inc.candidates[0].why.some((w) => w.includes('First service'))).toBe(true);
    expect(inc.candidates[0].why.some((w) => w.includes('http.latency'))).toBe(true);
    // All three services affected
    expect(inc.affectedServices.sort()).toEqual(['auth', 'cart', 'payment']);
    // Timeline has 3 entries ordered by time
    expect(inc.timeline).toHaveLength(3);
    expect(inc.timeline[0].at).toBe(T0);
    expect(inc.timeline[1].at).toBe(T15);
    expect(inc.timeline[2].at).toBe(T30);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose packages/correlation/src/incidentFactory.test.ts
```

Expected: FAIL — `Cannot find module './incidentFactory.js'`

- [ ] **Step 3: Implement `incidentFactory.ts`**

Create `packages/correlation/src/incidentFactory.ts`:

```ts
import type { Incident, ChangeEvent, Severity, TimelineEntry, Signal } from '@tracelens/shared';
import { confidenceFromScore } from '@tracelens/shared';
import type { AnomalyGroup } from './temporalCorrelation.js';

function deriveSeverity(maxDeltaPct: number): Severity {
  if (maxDeltaPct >= 200) return 'critical';
  if (maxDeltaPct >= 100) return 'high';
  if (maxDeltaPct >= 50)  return 'medium';
  return 'low';
}

export function buildIncident(
  group: AnomalyGroup,
  services: string[],
  changes: ChangeEvent[],
  incidentId?: string,
): Incident {
  const id = incidentId ?? `INC-${Date.parse(group.windowStart)}`;
  const windowMs = Date.parse(group.windowEnd) - Date.parse(group.windowStart);

  // Timeline: signal entries from anomalies + change entries
  const signalEntries: TimelineEntry[] = group.anomalies.map((a) => ({
    at: a.timestamp,
    kind: 'signal' as const,
    text: `${a.service} ${a.metric} deviated ${a.deltaPct > 0 ? '+' : ''}${Math.round(a.deltaPct)}% from baseline`,
  }));
  const changeEntries: TimelineEntry[] = changes.map((c) => ({
    at: c.at,
    kind: 'change' as const,
    text: c.text,
  }));
  const timeline = [...signalEntries, ...changeEntries].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );

  // Signals
  const signals: Signal[] = group.anomalies.map((a) => ({
    metric: `${a.service}.${a.metric}`,
    deltaPct: a.deltaPct,
  }));

  // Severity
  const maxDeltaPct = Math.max(...group.anomalies.map((a) => Math.abs(a.deltaPct)));
  const severity = deriveSeverity(maxDeltaPct);

  // Candidates ranked by earliest onset per service
  const onsetByService = new Map<string, number>();
  for (const a of group.anomalies) {
    const t = Date.parse(a.timestamp);
    const existing = onsetByService.get(a.service);
    if (existing === undefined || t < existing) onsetByService.set(a.service, t);
  }

  const windowStart = Date.parse(group.windowStart);
  const sortedServices = services.slice().sort(
    (a, b) => (onsetByService.get(a) ?? Infinity) - (onsetByService.get(b) ?? Infinity),
  );

  const candidates = sortedServices.map((svc, idx) => {
    const onset = onsetByService.get(svc) ?? windowStart;
    const onsetOffsetMs = onset - windowStart;
    const score = windowMs > 0 ? Math.max(0, 1 - onsetOffsetMs / windowMs) : 1;
    const confidence = confidenceFromScore(score);

    const serviceAnomalies = group.anomalies.filter((a) => a.service === svc);
    const why: string[] = [];
    if (idx === 0) why.push('First service to show anomaly in this window');
    for (const a of serviceAnomalies) {
      why.push(
        `${a.metric} spiked ${a.deltaPct > 0 ? '+' : ''}${Math.round(a.deltaPct)}% above rolling baseline`,
      );
      why.push(`Anomaly detected at ${a.timestamp}`);
    }

    return { component: svc, confidence, why, score };
  });

  return {
    id,
    startedAt: group.windowStart,
    severity,
    affectedServices: services,
    timeline,
    signals,
    changes,
    candidates,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose packages/correlation/src/incidentFactory.test.ts
```

Expected: all 6 tests PASS (including the injected-incident integration test)

- [ ] **Step 5: Commit**

```bash
git add packages/correlation/src/incidentFactory.ts packages/correlation/src/incidentFactory.test.ts
git commit -m "feat(correlation): add incident factory with ranked candidates and injected-incident test"
```

---

## Task 6: Wire Up Public API in `index.ts`

**Files:**
- Modify: `packages/correlation/src/index.ts`

- [ ] **Step 1: Add re-exports to `index.ts`**

Open `packages/correlation/src/index.ts` and append the following lines at the bottom (keep all existing code untouched):

```ts
export { detectAnomalies } from './anomaly.js';
export type { AnomalyResult } from './anomaly.js';

export { groupByTimeWindow } from './temporalCorrelation.js';
export type { AnomalyGroup } from './temporalCorrelation.js';

export { findCoAnomalousServices } from './serviceCorrelation.js';

export { collectChanges } from './whatChanged.js';

export { buildIncident } from './incidentFactory.js';
```

- [ ] **Step 2: Run all correlation tests to make sure nothing broke**

```bash
npm test -- --reporter=verbose packages/correlation
```

Expected: all tests PASS

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests across all packages PASS

- [ ] **Step 4: Commit**

```bash
git add packages/correlation/src/index.ts
git commit -m "feat(correlation): export new public API from index"
```

---

## Task 7: Write `docs/CORRELATION.md`

**Files:**
- Create: `docs/CORRELATION.md`

- [ ] **Step 1: Create the doc**

Create `docs/CORRELATION.md`:

```markdown
# Correlation & Incident Intelligence

TraceLens detects anomalies in telemetry, correlates them across services, and assembles
an `Incident` with a timeline and ranked root-cause candidates. Every candidate carries a
**confidence level**, not a certainty — the system surfaces evidence for engineers to verify.

## Algorithm

### 1. Rolling-Baseline Anomaly Detection (`anomaly.ts`)

For each `(service, metric)` pair, TraceLens maintains a sliding window of the last
`windowSize` (default: 10) observed values. Each incoming metric event is tested against
`isAnomalous(current, window, thresholdPct)`:

```
deltaPct = (current - mean(window)) / mean(window) × 100
anomalous = |deltaPct| >= thresholdPct
```

Only anomalous points are emitted as `AnomalyResult` objects for the next stage.

### 2. Temporal Correlation (`temporalCorrelation.ts`)

`AnomalyResult[]` is sorted by timestamp and grouped into `AnomalyGroup[]`. A new group
starts whenever the gap between consecutive anomalies exceeds `windowMs` (default: 60,000 ms).

### 3. Service Correlation (`serviceCorrelation.ts`)

Within each `AnomalyGroup`, all distinct services are extracted as the **co-anomalous
service set**. No dependency-graph lookup is required — temporal co-occurrence is the signal.

### 4. What Changed (`whatChanged.ts`)

`deploy` and `config_change` telemetry events whose timestamps fall within
`[windowStart, windowEnd]` are collected as `ChangeEvent[]`. They appear on the incident
timeline as context, but do not affect candidate ranking in v1.

### 5. Incident Assembly (`incidentFactory.ts`)

`buildIncident` takes the group, co-anomalous services, and change events and produces
an `Incident`:

- **Timeline**: all signal and change entries sorted by timestamp (ascending).
- **Severity**: derived from the largest absolute `deltaPct` in the group.
  - `>= 200%` → `critical` · `>= 100%` → `high` · `>= 50%` → `medium` · else `low`
- **Candidates**: one per service, ranked by **earliest anomaly onset**.
  - `score = 1 - (onsetOffsetMs / windowMs)`, clamped to `[0, 1]`
  - `confidence = confidenceFromScore(score)` (thresholds: ≥0.66 → high, ≥0.33 → medium, else low)
  - `why[]` lists the spike magnitude, timestamp, and (for rank-1) the "First service" marker.

## Parameters

| Parameter | Default | Where used | Effect |
|-----------|---------|------------|--------|
| `windowSize` | `10` | `detectAnomalies` | Number of past data points used as the rolling baseline |
| `thresholdPct` | `50` | `detectAnomalies` | Minimum % deviation from baseline mean to flag as anomalous |
| `windowMs` | `60000` | `groupByTimeWindow` | Max gap (ms) between anomalies before starting a new group |

## Confidence, Not Certainty

Confidence levels (`low` / `medium` / `high`) reflect how strongly the *observable evidence*
points to a candidate — not a definitive answer. The `why[]` array on each candidate lists
the raw signals so engineers can verify or dismiss the suggestion. The ranking algorithm is
intentionally transparent: earliest onset + largest deviation are the only inputs, and both
are shown directly in `why[]`.

Never treat a `high`-confidence candidate as a confirmed root cause. Always verify with
logs, traces, and deployment history.
```

- [ ] **Step 2: Verify the file renders cleanly (no broken markdown)**

```bash
cat docs/CORRELATION.md | head -20
```

Expected: clean markdown output starting with `# Correlation & Incident Intelligence`

- [ ] **Step 3: Commit**

```bash
git add docs/CORRELATION.md
git commit -m "docs: add CORRELATION.md — algorithm, params, confidence-not-certainty rationale"
```

---

## Task 8: Final CI Check

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests PASS across all packages

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no TypeScript errors

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no lint errors

- [ ] **Step 4: If any issues found, fix and commit before opening PR**
