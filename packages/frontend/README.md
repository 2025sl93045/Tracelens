# @tracelens/frontend

**Owner:** Member 4 — Frontend & OSS / Release Engineering

The React + TypeScript dashboard (Vite). Also the home of the project's
open-source/release engineering work (CI, license, docs, releases) at the repo
root.

## Scope / tasks

- Incident list view
- Incident detail: timeline, evidence explorer, "What changed?" panel
- Dependency graph visualization (React Flow or Cytoscape)
- API client against `@tracelens/shared` `API_ROUTES` + auth
- CI/CD, README/CONTRIBUTING upkeep, versioning & releases

See the team roles doc (§4, Member 4).

## Dev

```bash
npm run dev --workspace packages/frontend
# http://localhost:5173
```
