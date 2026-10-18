import { describe, it, expect } from 'vitest';
import { isTelemetryType, confidenceFromScore, SEVERITY_LEVELS } from './index.js';

describe('isTelemetryType', () => {
  it('accepts known telemetry types', () => {
    expect(isTelemetryType('metric')).toBe(true);
    expect(isTelemetryType('deploy')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isTelemetryType('banana')).toBe(false);
    expect(isTelemetryType(42)).toBe(false);
    expect(isTelemetryType(undefined)).toBe(false);
  });
});

describe('confidenceFromScore', () => {
  it('maps scores to coarse confidence levels', () => {
    expect(confidenceFromScore(0.9)).toBe('high');
    expect(confidenceFromScore(0.66)).toBe('high');
    expect(confidenceFromScore(0.5)).toBe('medium');
    expect(confidenceFromScore(0.33)).toBe('medium');
    expect(confidenceFromScore(0.1)).toBe('low');
    expect(confidenceFromScore(0)).toBe('low');
  });
});

describe('SEVERITY_LEVELS', () => {
  it('is ordered low → critical', () => {
    expect(SEVERITY_LEVELS).toEqual(['low', 'medium', 'high', 'critical']);
  });
});
