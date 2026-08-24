// client/src/modules/workspace/utils/graphUtils.ts
// Pure graph logic: topological sorting + upstream/downstream resolution.
// No React, no store — fully reusable and testable.

import type { Node, Edge } from 'reactflow';

/**
 * All node IDs upstream (direct or transitive) of `nodeId`. Excludes the node itself.
 */
export function getAncestors(nodeId: string, edges: Edge[]): Set<string> {
  const parents = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!parents.has(e.target)) parents.set(e.target, []);
    parents.get(e.target)!.push(e.source);
  });

  const ancestors = new Set<string>();
  const queue: string[] = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const parent of parents.get(current) ?? []) {
      if (!ancestors.has(parent)) {
        ancestors.add(parent);
        queue.push(parent);
      }
    }
  }
  return ancestors;
}

/**
 * All node IDs downstream of `nodeId` (for v1.1: knowing which nodes to
 * invalidate/re-run when this one changes). Excludes the node itself.
 */
export function getDescendants(nodeId: string, edges: Edge[]): Set<string> {
  const children = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!children.has(e.source)) children.set(e.source, []);
    children.get(e.source)!.push(e.target);
  });

  const descendants = new Set<string>();
  const queue: string[] = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of children.get(current) ?? []) {
      if (!descendants.has(child)) {
        descendants.add(child);
        queue.push(child);
      }
    }
  }
  return descendants;
}

/**
 * Kahn's topological sort. Deterministic (preserves array order among ties).
 * If a cycle is detected, falls back to the original order (safe, non-crashing).
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const ids = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
  });

  edges.forEach((e) => {
    // Only count edges between nodes that actually exist
    if (ids.has(e.source) && ids.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
      adjacency.get(e.source)!.push(e.target);
    }
  });

  const queue: string[] = nodes
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .map((n) => n.id);

  const ordered: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(id);
    for (const next of adjacency.get(id) ?? []) {
      const remaining = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  // Cycle detected → fall back to original order
  if (ordered.length !== nodes.length) return [...nodes];

  const byId = new Map(nodes.map((n) => [n.id, n]));
  return ordered.map((id) => byId.get(id)!);
}

/**
 * The execution chain for running a single node:
 * [all ancestors..., targetNode] in topological order.
 */
export function getExecutionChain(nodeId: string, nodes: Node[], edges: Edge[]): Node[] {
  const ancestors = getAncestors(nodeId, edges);
  const chainNodes = nodes.filter((n) => ancestors.has(n.id) || n.id === nodeId);
  return topologicalSort(chainNodes, edges);
}