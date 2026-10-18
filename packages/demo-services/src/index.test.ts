import { describe, it, expect } from 'vitest';
import { sampleIncidentTelemetry } from './index.js';

describe('sampleIncidentTelemetry', () => {
  it('produces a deploy event and metric signals for payment-service', () => {
    const events = sampleIncidentTelemetry(new Date('2026-10-18T14:32:18.000Z'));
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events.every((e) => e.service === 'payment-service')).toBe(true);
    expect(events.some((e) => e.type === 'deploy')).toBe(true);
    expect(events.every((e) => e.timestamp === '2026-10-18T14:32:18.000Z')).toBe(true);
  });
});
