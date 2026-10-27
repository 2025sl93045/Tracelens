import type { TelemetryEvent, ChangeEvent } from '@tracelens/shared';

export function collectChanges(
  events: TelemetryEvent[],
  windowStart: string,
  windowEnd: string,
): ChangeEvent[] {
  const start = Date.parse(windowStart);
  const end   = Date.parse(windowEnd);

  return events
    .filter((e) => {
      if (e.type !== 'deploy' && e.type !== 'config_change') return false;
      const t = Date.parse(e.timestamp);
      return t >= start && t <= end;
    })
    .map((e) => ({
      at: e.timestamp,
      text: `${e.type}: ${e.name} on ${e.service}`,
    }));
}
