import { describe, it, expect } from 'vitest';
import type { DependencyGraph } from '@tracelens/shared';
import { downstreamImpact } from './index.js';

const graph: DependencyGraph = {
  nodes: [
    { id: 'gateway', kind: 'service', label: 'gateway' },
    { id: 'order', kind: 'service', label: 'order' },
    { id: 'payment', kind: 'service', label: 'payment' },
    { id: 'db', kind: 'database', label: 'db' },
  ],
  edges: [
    { from: 'gateway', to: 'order', kind: 'CALLS' },
    { from: 'order', to: 'payment', kind: 'CALLS' },
    { from: 'payment', to: 'db', kind: 'DEPENDS_ON' },
  ],
};

describe('downstreamImpact', () => {
  it('returns everything reachable from a node', () => {
    const result = downstreamImpact(graph, 'order');
    expect(result.node).toBe('order');
    expect(result.affected.sort()).toEqual(['db', 'payment']);
  });

  it('returns empty for a leaf node', () => {
    expect(downstreamImpact(graph, 'db').affected).toEqual([]);
  });

  it('is cycle-safe and excludes the start node', () => {
    const cyclic: DependencyGraph = {
      nodes: graph.nodes,
      edges: [
        { from: 'a', to: 'b', kind: 'CALLS' },
        { from: 'b', to: 'a', kind: 'CALLS' },
      ],
    };
    // 'a' reaches 'b'; the cycle back to 'a' must not loop forever, and the
    // start node is not counted as affected by itself.
    expect(downstreamImpact(cyclic, 'a').affected).toEqual(['b']);
  });
});
