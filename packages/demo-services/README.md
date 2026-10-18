# @tracelens/demo-services

**Owner:** Member 1 — Telemetry & Demo Environment

The "system under observation" for TraceLens: a small set of demo microservices
(`gateway → order → payment → inventory → db-sim`) that emit telemetry and can be
made to fail on demand, so you can trigger realistic incidents during a demo.

## Scope / tasks

- Services + call chain (Express)
- Telemetry emission (metrics, logs, traces) to the ingestion API
- Deploy / config-change events
- Fault-injection controller (latency, error-rate, pool exhaustion, bad deploy)
- Scenario generator (`examples/`) for a repeatable incident
- Docker Compose wiring for the full stack

See the team roles doc (§4, Member 1) for the full feature list and acceptance criteria.

## Dev

```bash
npm run dev --workspace packages/demo-services
```
