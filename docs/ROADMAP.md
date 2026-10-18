# TraceLens Roadmap

## In scope (MVP — this semester)

- [ ] Demo microservices + fault injection (Member 1)
- [ ] Telemetry ingestion + persistence (Member 1)
- [ ] Anomaly detection + temporal/service/deploy correlation (Member 2)
- [ ] Incident engine: creation, timeline, ranked candidates (Member 2)
- [ ] Service dependency graph + impact analysis (Member 3)
- [ ] Core API + auth (Member 3)
- [ ] Dashboard: incident list, detail, dependency graph (Member 4)
- [ ] Tests, CI, docs, Docker Compose full stack, tagged `v0.1.0` release

## Deliberately deferred (future work)

These are **out of scope on purpose** to keep the MVP complete and polished.
They make good "future work" talking points in the report/viva:

- Kafka / event streaming (currently: direct HTTP + PostgreSQL)
- Neo4j / OpenSearch (currently: PostgreSQL + in-memory graph)
- Kubernetes deployment (currently: Docker Compose)
- Real external OpenTelemetry integrations (currently: built-in demo services)
- AI Incident Copilot — optional stretch if ahead of schedule (Member 2)
- Plugin/connector system (GitHub, Jira, PagerDuty, Prometheus, ...)
