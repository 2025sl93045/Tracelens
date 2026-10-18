# @tracelens/shared

Shared TypeScript types and contracts used across all TraceLens modules. This
package is the single source of truth for the data that flows between services
(§6 of the team roles doc). Changing a type here affects everyone, so changes
should be discussed and reviewed carefully.

## What's here

| File | Contract | Owner who produces it |
|---|---|---|
| `telemetry.ts` | `TelemetryEvent` and types (§6.1) | demo-services / ingestion |
| `incident.ts` | `Incident`, `RootCauseCandidate`, `confidenceFromScore` (§6.2) | correlation |
| `graph.ts` | `DependencyGraph`, `ImpactResult` (§6.3) | graph |
| `api.ts` | HTTP request/response shapes + `API_ROUTES` (§6.4) | api ↔ frontend |

## Usage

```ts
import { TelemetryEvent, Incident, DependencyGraph } from '@tracelens/shared';
```

## Build & test

```bash
npm run build --workspace packages/shared
npm test
```
