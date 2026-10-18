/**
 * demo-services — the "system under observation".
 *
 * OWNER: Member 1 (Telemetry & Demo Environment)
 *
 * GOAL: a small set of services (gateway → order → payment → inventory → db-sim)
 * that emit telemetry to the ingestion API and can be made to fail on demand via
 * a fault-injection switch, so incidents can be triggered live during the demo.
 *
 * TODO (open an issue per item and implement behind PRs):
 *  - [ ] Stand up the services (Express) and wire the call chain between them.
 *  - [ ] Emit metrics/logs/traces as TelemetryEvent to the ingestion API.
 *  - [ ] Emit deploy / config_change events.
 *  - [ ] Fault-injection controller: latency, error-rate, pool-exhaustion, bad-deploy.
 *  - [ ] Scenario generator script under ../../examples/ to drive a repeatable incident.
 *
 * The helper below is a starting point: it produces a sample telemetry burst
 * representing a payment-latency spike, so other packages have realistic input
 * to develop against before the full services exist.
 */
import type { TelemetryEvent } from '@tracelens/shared';

/** A small, deterministic sample of telemetry representing an incident. */
export function sampleIncidentTelemetry(at: Date = new Date()): TelemetryEvent[] {
  const ts = at.toISOString();
  return [
    {
      type: 'deploy',
      service: 'payment-service',
      timestamp: ts,
      name: 'deployment',
      attributes: { version: 'v4.3.1' },
    },
    {
      type: 'metric',
      service: 'payment-service',
      timestamp: ts,
      name: 'http.latency.ms',
      value: 1240,
      attributes: { version: 'v4.3.1' },
    },
    {
      type: 'metric',
      service: 'payment-service',
      timestamp: ts,
      name: 'http.5xx.count',
      value: 37,
    },
  ];
}
