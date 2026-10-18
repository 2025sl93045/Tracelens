/**
 * Telemetry contracts (§6.1).
 *
 * Produced by: demo-services / any collector (Member 1)
 * Consumed by: ingestion (Member 1), correlation (Member 2), graph (Member 3)
 */

/** The kinds of telemetry TraceLens understands. */
export type TelemetryType = 'metric' | 'log' | 'trace' | 'deploy' | 'config_change';

export const TELEMETRY_TYPES: readonly TelemetryType[] = [
  'metric',
  'log',
  'trace',
  'deploy',
  'config_change',
] as const;

/**
 * A single telemetry event. The shape is intentionally close to the
 * OpenTelemetry data model so collectors can map onto it easily.
 */
export interface TelemetryEvent {
  /** What kind of signal this is. */
  type: TelemetryType;
  /** Emitting service, e.g. "payment-service". */
  service: string;
  /** ISO-8601 timestamp, e.g. "2026-10-18T14:32:18.000Z". */
  timestamp: string;
  /** Signal name, e.g. "http.latency.ms" or "deployment". */
  name: string;
  /** Numeric value for metrics (ms, count, percent, ...). */
  value?: number;
  /** Trace correlation ids (present on `trace` events). */
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  /** Free-form attributes, e.g. { version: "v4.3.1", "http.status": 500 }. */
  attributes?: Record<string, string | number | boolean>;
}

/** Runtime type guard for a `TelemetryType`. */
export function isTelemetryType(value: unknown): value is TelemetryType {
  return typeof value === 'string' && (TELEMETRY_TYPES as readonly string[]).includes(value);
}
