// client/src/modules/workspace/utils/pipelineValidator.ts
// Pre-flight validation before Execute Workflow. Blocks execution on:
//   • dependency cycles (topological order is impossible)
//   • non-source nodes with no incoming edge (their dependency order is unknown)
//   • no data source
// Notes are never validated or executed.
import { Node, Edge } from 'reactflow';
import { MLNodeData, normalizeTitle } from '../config/nodeRegistry';

export interface PipelineValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const SOURCE_TITLES = ['Load CSV', 'Load JSON', 'Load Excel', 'Load Database', 'Load REST API', 'Sample Dataset'];

export function validatePipeline(nodes: Node[], edges: Edge[]): PipelineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const execNodes = nodes.filter((n) => normalizeTitle((n.data as MLNodeData).title) !== 'Note');
  if (execNodes.length === 0) {
    return { valid: false, errors: ['Workflow is empty — add nodes first.'], warnings };
  }

  // 1. Cycle detection (Kahn's algorithm — explicit, unlike topologicalSort's silent fallback)
  const ids = new Set(execNodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  execNodes.forEach((n) => { inDegree.set(n.id, 0); adjacency.set(n.id, []); });
  edges.forEach((e) => {
    if (ids.has(e.source) && ids.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
      adjacency.get(e.source)!.push(e.target);
    }
  });
  const queue = execNodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  let processed = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    processed++;
    adjacency.get(current)!.forEach((next) => {
      const remaining = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    });
  }
  if (processed < execNodes.length) {
    errors.push('Workflow contains a dependency cycle — execution order cannot be determined. Remove the loop in your connections.');
  }

  // 2. Disconnected non-source nodes: without an incoming edge, dependency
  //    order is unknown and this node may execute before its data exists.
  execNodes.forEach((n) => {
    const data = n.data as MLNodeData;
    const isSource = data.inputs.length === 0;
    const hasIncoming = edges.some((e) => e.target === n.id);
    if (!isSource && !hasIncoming) {
      errors.push(`"${data.title}" has no input connection — connect it into the pipeline (execution order follows edges, not canvas position).`);
    }
  });

  // 3. A data source must exist
  const hasSource = execNodes.some((n) => SOURCE_TITLES.includes(normalizeTitle((n.data as MLNodeData).title)));
  if (!hasSource) {
    errors.push('No data source found — add a Load CSV node (or similar) first.');
  }

  return { valid: errors.length === 0, errors, warnings };
}