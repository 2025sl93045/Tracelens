/**
 * api — the single REST API the frontend talks to.
 *
 * OWNER: Member 3 (Dependency Graph & Backend Platform)
 *
 * GOAL: expose incidents, services, and graph data to the dashboard, with JWT
 * login + simple RBAC (viewer/admin). API keys guard ingestion separately.
 *
 * TODO (issue + PR per item):
 *  - [ ] POST /auth/login -> JWT; auth middleware + RBAC.
 *  - [ ] GET /incidents, GET /incidents/:id (from correlation output).
 *  - [ ] GET /services, GET /graph, GET /graph/impact (from graph service).
 *  - [ ] Wire PostgreSQL data layer (shared with ingestion).
 *  - [ ] Dockerfile + health endpoint.
 *
 * `healthStatus` and `requiredRole` are tested starting points.
 */
import type { UserRole } from '@tracelens/shared';

export interface HealthStatus {
  status: 'ok';
  service: 'tracelens-api';
  version: string;
}

/** Payload returned by GET /health (used by Docker healthchecks). */
export function healthStatus(version = '0.1.0'): HealthStatus {
  return { status: 'ok', service: 'tracelens-api', version };
}

/** True if `role` satisfies the `required` role (admin implies viewer). */
export function roleSatisfies(role: UserRole, required: UserRole): boolean {
  if (required === 'viewer') return role === 'viewer' || role === 'admin';
  return role === 'admin';
}
