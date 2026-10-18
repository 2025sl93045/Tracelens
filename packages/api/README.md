# @tracelens/api

**Owner:** Member 3 — Dependency Graph & Backend Platform

The single REST API the dashboard talks to. Serves incidents, services, and
graph data; handles JWT login and simple RBAC (viewer/admin). Route contracts
live in `@tracelens/shared` (`API_ROUTES`).

## Scope / tasks

- `POST /auth/login` → JWT; auth middleware + RBAC (`roleSatisfies` starter)
- `GET /incidents`, `GET /incidents/:id`
- `GET /services`, `GET /graph`, `GET /graph/impact`
- PostgreSQL data layer (shared with ingestion)
- Health endpoint + Dockerfile

See the team roles doc (§4, Member 3).

## Dev

```bash
npm run dev --workspace packages/api
```
