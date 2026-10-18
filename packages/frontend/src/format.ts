import type { Severity } from '@tracelens/shared';

/** Human-friendly label for a severity (used by list/detail views). */
export function severityLabel(severity: Severity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

/** Format an ISO-8601 timestamp as a short local time for the timeline. */
export function shortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(11, 19); // HH:MM:SS (UTC, deterministic for tests)
}
