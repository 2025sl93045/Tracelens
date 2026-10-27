# Correlation & Incident Intelligence Engine — Design Spec

**Date:** 2026-10-27
**Owner:** M2 (Correlation & Incident Intelligence)
**Issue:** Closes #2

---

## Goal

Turn a stream of `TelemetryEvent[]` into `Incident` objects with an ordered timeline, ranked root-cause candidates, and a confidence level — presenting evidence, never certainty.

---

## Architecture

All new code lives in `packages/correlation/src/`. The existing helpers (`isAnomalous`, `percentDelta`, `mean`) in `index.ts` are kept untouched; new modules build on them.

```
packages/correlation/src/
  index.ts                      ← existing helpers + re-exports new public API
  anomaly.ts                    ← rolling-baseline detector
  temporalCorrelation.ts        ← time-window grouping
  serviceCorrelation.ts         ← co-anomalous service set
  whatChanged.ts                ← collect change events
  incidentFactory.ts            ← assemble Incident
  anomaly.test.ts
  temporalCorrelation.test.ts
  serviceCorrelation.test.ts
  whatChanged.test.ts
  incidentFactory.test.ts       ← includes injected-incident integration test
```

---

## Data Flow

```
TelemetryEvent[]
       │
       ▼
  anomaly.ts
  detectAnomalies(events, windowSize)
  → AnomalyResult[]
       │
       ▼
  temporalCorrelation.ts
  groupByTimeWindow(anomalies, windowMs = 60_000)
  → AnomalyGroup[]
       │
       ▼
  serviceCorrelation.ts
  findCoAnomalousServices(group)
  → string[]
       │
       ▼
  whatChanged.ts
  collectChanges(events, windowStart, windowEnd)
  → ChangeEvent[]
       │
       ▼
  incidentFactory.ts
  buildIncident(group, services, changes)
  → Incident
```

Each step takes plain data in and returns plain data out — no shared state, no side effects.

---

## Module Contracts

### `anomaly.ts`

```ts
export interface AnomalyResult {
  service: string;
  metric: string;
  timestamp: string;   // ISO-8601
  deltaPct: number;
  value: number;
  baseline: number[];  // the window used
}

export function detectAnomalies(
  events: TelemetryEvent[],
  windowSize: number = 10,   // sliding window — last N metric values per service+metric
  thresholdPct: number = 50,
): AnomalyResult[]
```

- Groups `metric` type events by `(service, name)`.
- Slides a window of `windowSize` over the series; each new point is tested against `isAnomalous(current, window)`.
- Only anomalous points are returned.

### `temporalCorrelation.ts`

```ts
export interface AnomalyGroup {
  windowStart: string;  // ISO-8601 of earliest anomaly
  windowEnd: string;    // ISO-8601 of latest anomaly
  anomalies: AnomalyResult[];
}

export function groupByTimeWindow(
  anomalies: AnomalyResult[],
  windowMs: number = 60_000,
): AnomalyGroup[]
```

- Sorts anomalies by timestamp.
- A new group starts when the gap to the previous anomaly exceeds `windowMs`.

### `serviceCorrelation.ts`

```ts
export function findCoAnomalousServices(group: AnomalyGroup): string[]
```

- Returns deduplicated service names present in the group.
- No dependency-graph lookup required; temporal co-occurrence is sufficient for v1.

### `whatChanged.ts`

```ts
export function collectChanges(
  events: TelemetryEvent[],
  windowStart: string,
  windowEnd: string,
): ChangeEvent[]
```

- Filters events of type `deploy` or `config_change` whose timestamp falls within `[windowStart, windowEnd]`.
- Maps them to `ChangeEvent` (`at`, `text`).
- Change events appear on the timeline only — they do not affect candidate ranking in v1.

### `incidentFactory.ts`

```ts
export function buildIncident(
  group: AnomalyGroup,
  services: string[],
  changes: ChangeEvent[],
  incidentId?: string,   // defaults to auto-generated "INC-<timestamp>"
): Incident
```

- **Timeline**: all anomaly signals + change events, sorted ascending by timestamp. Each entry is a `TimelineEntry` with `kind: 'signal'` or `kind: 'deploy'/'change'`.
- **Severity**: derived from the highest `deltaPct` in the group:
  - `>= 200%` → `critical`, `>= 100%` → `high`, `>= 50%` → `medium`, else `low`.
- **Candidates**: one per co-anomalous service, ranked by earliest anomaly onset (ascending).
  - `score = 1 - (onsetOffsetMs / windowMs)` clamped to `[0, 1]`.
  - `confidence = confidenceFromScore(score)` (existing shared helper).
  - `why[]` includes:
    - `"First service to show anomaly in this window"` (rank-1 only)
    - `"<metric> spiked +<deltaPct>% above rolling baseline"`
    - `"Anomaly detected at <timestamp>"`

---

## Candidate Ranking — Confidence Not Certainty

Confidence levels (`low` / `medium` / `high`) represent how strongly the observable evidence points to a candidate — not a definitive root cause. The `why[]` array surfaces the raw evidence so engineers can verify or dismiss each candidate.

Thresholds (from `confidenceFromScore` in `@tracelens/shared`):
- `score >= 0.66` → `high`
- `score >= 0.33` → `medium`
- `score < 0.33` → `low`

---

## Testing Strategy

### Unit tests (per module)

| File | Key cases |
|------|-----------|
| `anomaly.test.ts` | Sliding window produces correct `AnomalyResult[]`; non-anomalous values excluded; empty input returns `[]` |
| `temporalCorrelation.test.ts` | Events within 60s grouped together; events outside window form separate groups; single-event group |
| `serviceCorrelation.test.ts` | Correct deduplicated service names from a group |
| `whatChanged.test.ts` | Only `deploy`/`config_change` events within window returned; metric events excluded |
| `incidentFactory.test.ts` | Timeline ordered by timestamp; candidates ordered by onset; severity derived correctly |

### Injected-incident integration test (in `incidentFactory.test.ts`)

- **Setup**: inject `payment-service` anomaly at T+0, `auth-service` at T+15s, `cart-service` at T+30s — all within a 60s window.
- **Expected top candidate**: `payment-service` (earliest onset, score ≈ 1.0).
- **Expected confidence**: `high`.
- **Expected `why[]`**: contains `"First service to show anomaly"` and the spike description.

---

## Docs

`docs/CORRELATION.md` to be written covering:
- Algorithm overview (rolling baseline → temporal grouping → service correlation → incident assembly)
- Parameters (`windowSize`, `windowMs`, `thresholdPct`) and their defaults
- "Confidence not certainty" rationale

---

## Definition of Done

- [ ] All five modules implemented with unit tests
- [ ] Injected-incident integration test passes
- [ ] `docs/CORRELATION.md` written
- [ ] CI green
- [ ] PR references `Closes #2`, reviewed by a non-author teammate
