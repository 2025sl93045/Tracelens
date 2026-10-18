/**
 * ingestion — telemetry intake API.
 *
 * OWNER: Member 1 (Telemetry & Demo Environment)
 *
 * GOAL: accept telemetry over HTTP (API-key protected), validate it against the
 * shared contract, and persist it to PostgreSQL for the correlation and graph
 * services to read.
 *
 * TODO (issue + PR per item):
 *  - [ ] POST /telemetry (single) and POST /telemetry/batch, guarded by INGESTION_API_KEY.
 *  - [ ] Persist to PostgreSQL (schema coordinated with Member 3's data layer).
 *  - [ ] Reject malformed events with 400 and a helpful error.
 *  - [ ] Health endpoint for Docker.
 *
 * The validator below is the starting point and is already unit-tested.
 */
import { isTelemetryType, type TelemetryEvent } from '@tracelens/shared';

/** Narrow unknown JSON into a TelemetryEvent, or throw a descriptive error. */
export function parseTelemetryEvent(input: unknown): TelemetryEvent {
  if (typeof input !== 'object' || input === null) {
    throw new Error('telemetry event must be an object');
  }
  const e = input as Record<string, unknown>;
  if (!isTelemetryType(e.type)) {
    throw new Error(`invalid telemetry type: ${String(e.type)}`);
  }
  if (typeof e.service !== 'string' || e.service.length === 0) {
    throw new Error('telemetry event requires a non-empty "service"');
  }
  if (typeof e.timestamp !== 'string' || Number.isNaN(Date.parse(e.timestamp))) {
    throw new Error('telemetry event requires a valid ISO-8601 "timestamp"');
  }
  if (typeof e.name !== 'string' || e.name.length === 0) {
    throw new Error('telemetry event requires a non-empty "name"');
  }
  if (e.value !== undefined && typeof e.value !== 'number') {
    throw new Error('telemetry "value" must be a number when present');
  }
  return input as TelemetryEvent;
}
