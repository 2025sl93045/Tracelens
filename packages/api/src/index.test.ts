import { describe, it, expect } from 'vitest';
import { healthStatus, roleSatisfies } from './index.js';

describe('healthStatus', () => {
  it('reports ok with service name and version', () => {
    expect(healthStatus('1.2.3')).toEqual({
      status: 'ok',
      service: 'tracelens-api',
      version: '1.2.3',
    });
  });
});

describe('roleSatisfies', () => {
  it('admin satisfies viewer and admin', () => {
    expect(roleSatisfies('admin', 'viewer')).toBe(true);
    expect(roleSatisfies('admin', 'admin')).toBe(true);
  });

  it('viewer satisfies only viewer', () => {
    expect(roleSatisfies('viewer', 'viewer')).toBe(true);
    expect(roleSatisfies('viewer', 'admin')).toBe(false);
  });
});
