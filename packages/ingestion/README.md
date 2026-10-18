# @tracelens/ingestion

**Owner:** Member 1 — Telemetry & Demo Environment

Telemetry intake API. Accepts `TelemetryEvent`s over HTTP (API-key protected),
validates them against `@tracelens/shared`, and persists them to PostgreSQL for
the correlation and graph services.

## Scope / tasks

- `POST /telemetry` and `POST /telemetry/batch` (guarded by `INGESTION_API_KEY`)
- Validation (`parseTelemetryEvent` is the starting point)
- Persistence to PostgreSQL (schema coordinated with Member 3)
- Health endpoint + Dockerfile

See the team roles doc (§4, Member 1).

## Dev

```bash
npm run dev --workspace packages/ingestion
```
