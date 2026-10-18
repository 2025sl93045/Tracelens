/**
 * @tracelens/shared — the contracts every TraceLens module agrees on.
 *
 * Import from this package instead of redefining types locally:
 *
 *   import { TelemetryEvent, Incident, DependencyGraph } from '@tracelens/shared';
 */
export * from './telemetry.js';
export * from './incident.js';
export * from './graph.js';
export * from './api.js';
