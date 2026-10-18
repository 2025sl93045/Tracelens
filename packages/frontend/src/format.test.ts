import { describe, it, expect } from 'vitest';
import { severityLabel, shortTime } from './format.js';

describe('severityLabel', () => {
  it('capitalizes the severity', () => {
    expect(severityLabel('high')).toBe('High');
    expect(severityLabel('critical')).toBe('Critical');
  });
});

describe('shortTime', () => {
  it('formats an ISO timestamp as HH:MM:SS', () => {
    expect(shortTime('2026-10-18T14:32:18.000Z')).toBe('14:32:18');
  });

  it('returns the input unchanged when it is not a date', () => {
    expect(shortTime('not-a-date')).toBe('not-a-date');
  });
});
