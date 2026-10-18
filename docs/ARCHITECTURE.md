# TraceLens Architecture

> Scope note: this describes the **lean MVP** we are building this semester. See
> [ROADMAP.md](ROADMAP.md) for what is intentionally deferred.

## Overview

TraceLens ingests telemetry and change events from a set of services, detects
incidents, correlates them with recent changes, and presents an explainable
investigation view. It never asserts causation — it surfaces **evidence and
correlation with a confidence level**.

```text
demo-services ──► ingestion ──► PostgreSQL ──► correlation ──► Incident
   (Member 1)     (Member 1)                   (Member 2)          │
        │                                                          ▼
        └──────────────► graph (Member 3) ──► api (Member 3) ──► frontend (Member 4)
```

## Modules and responsibilities

| Package | Responsibility | Owner |
|---|---|---|
| `shared` | Types/contracts shared across modules | all |
| `demo-services` | Emit telemetry + fault injection | Member 1 |
| `ingestion` | Validate + persist telemetry | Member 1 |
| `correlation` | Anomaly detection, correlation, incident engine | Member 2 |
| `graph` | Dependency graph + impact analysis | Member 3 |
| `api` | REST API + auth for the dashboard | Member 3 |
| `frontend` | React dashboard | Member 4 |

## Key data contracts

All inter-module data is typed in `@tracelens/shared`:

- **TelemetryEvent** (§6.1) — the unit of ingested data.
- **Incident** (§6.2) — the correlated output with timeline + ranked candidates.
- **DependencyGraph / ImpactResult** (§6.3) — the service graph and impact.
- **API routes & payloads** (§6.4) — the API ↔ frontend boundary.

## Design principles

1. **Evidence, not certainty.** Confidence levels, never "this caused it."
2. **Stable contracts.** Modules integrate through `@tracelens/shared`.
3. **Controllable demo.** Incidents are triggered via fault injection, not luck.
4. **Reviewed changes.** Everything lands via a reviewed pull request.
