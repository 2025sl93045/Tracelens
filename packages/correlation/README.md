# @tracelens/correlation

**Owner:** Member 2 — Correlation & Incident Intelligence

The analytical core: turns telemetry into `Incident`s with a timeline, ranked
root-cause candidates, and a confidence level. It presents **evidence and
correlation**, never definitive causation.

## Scope / tasks

- Anomaly detection (threshold + rolling baseline) — starters: `percentDelta`, `isAnomalous`
- Temporal + service correlation
- "What changed?" deployment/config correlation
- Incident creation, timeline generation, candidate ranking (`confidenceFromScore`)
- (Stretch) Incident Copilot — retrieve evidence first, explain second

See the team roles doc (§4, Member 2).
