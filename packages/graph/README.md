# @tracelens/graph

**Owner:** Member 3 — Dependency Graph & Backend Platform

Derives the service dependency graph from trace spans, stores/serves it, and
computes impact analysis (what is downstream/affected from a node).

## Scope / tasks

- Edge derivation from traces (parent span → child span = `CALLS`)
- Graph persistence (PostgreSQL adjacency) + query API
- `DEPLOYED` / `CHANGED_BY` / `AFFECTS` edges
- Impact analysis — starter: `downstreamImpact` (BFS, cycle-safe)

See the team roles doc (§4, Member 3).
