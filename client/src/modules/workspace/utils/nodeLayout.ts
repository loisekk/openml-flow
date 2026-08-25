// client/src/modules/workspace/utils/nodeLayout.ts
// Intelligent node placement — no more nodes spawning on top of each other.
import { Node, Edge } from 'reactflow';
import { topologicalSort } from './graphUtils';

const NODE_W = 220;
const NODE_H = 115;
const H_GAP = 130;
const V_GAP = 55;

/** Next position for manual node drops: right of the workflow's current end. */
export function getNextChainPosition(nodes: Node[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 100, y: 160 };
  const maxX = Math.max(...nodes.map((n) => n.position.x));
  const rightmost = nodes.filter((n) => n.position.x === maxX);
  const avgY = rightmost.reduce((sum, n) => sum + n.position.y, 0) / rightmost.length;
  return { x: maxX + NODE_W + H_GAP, y: avgY };
}

/**
 * Layered layout for AI-generated workflows: topological depth = x column,
 * siblings stacked vertically. Deterministic, readable left→right flow.
 */
export function layoutNodesByDepth(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const ordered = topologicalSort(nodes, edges);
  const depth = new Map<string, number>();
  ordered.forEach((n) => depth.set(n.id, 0));
  ordered.forEach((n) => {
    edges.filter((e) => e.source === n.id).forEach((e) => {
      const candidate = (depth.get(n.id) ?? 0) + 1;
      if (candidate > (depth.get(e.target) ?? 0)) depth.set(e.target, candidate);
    });
  });

  const columns = new Map<number, Node[]>();
  nodes.forEach((n) => {
    const d = depth.get(n.id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(n);
  });

  return nodes.map((n) => ({
    ...n,
    position: {
      x: 80 + (depth.get(n.id) ?? 0) * (NODE_W + H_GAP),
      y: 140 + (columns.get(depth.get(n.id) ?? 0)?.indexOf(n) ?? 0) * (NODE_H + V_GAP),
    },
  }));
}

/** Position for an AI note attached to a node: below-right of its target. */
export function getNotePosition(target: Node): { x: number; y: number } {
  return { x: target.position.x + 40, y: target.position.y + NODE_H + 30 };
}