// client/src/modules/workspace/hooks/useValidationEngine.ts
import { useWorkflowStore } from '../store/workflowStore';
import { MLNodeData, normalizeTitle } from '../config/nodeRegistry';
import { getAncestors } from '../utils/graphUtils';

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'success';
  message: string;
  nodeId?: string;
}

const DATA_SOURCES = ['Load CSV', 'Load JSON', 'Load Excel', 'Load Database', 'Load REST API', 'Sample Dataset'];

/** Is `targetTitle` among the (transitive) upstream nodes of `nodeId`? */
const isDownstreamOf = (nodeId: string, targetTitle: string, nodes: any[], edges: any[]): boolean => {
  const ancestors = getAncestors(nodeId, edges);
  return nodes.some((n) => ancestors.has(n.id) && normalizeTitle((n.data as MLNodeData).title) === targetTitle);
};

export const useValidationEngine = () => {
  const { nodes, edges } = useWorkflowStore();
  const issues: ValidationIssue[] = [];

  if (nodes.length === 0) {
    return { issues, healthScore: 0 };
  }

  const execNodes = nodes.filter((n) => normalizeTitle((n.data as MLNodeData).title) !== 'Note');
  const title = (n: any) => normalizeTitle((n.data as MLNodeData).title);

  // 1. Data source
  const sourceNode = execNodes.find((n) => DATA_SOURCES.includes(title(n)));
  if (!sourceNode) {
    issues.push({ id: 'no-source', severity: 'error', message: 'Missing Data Source (Add a Load CSV node)' });
  } else {
    issues.push({ id: 'has-source', severity: 'success', message: 'Data source configured' });
  }

  // 2. Model (registry category is 'Models' — was 'Modeling', never matched)
  const modelNode = execNodes.find((n) => (n.data as MLNodeData).category === 'Models');
  if (!modelNode) {
    issues.push({ id: 'no-model', severity: 'warning', message: 'No Model node found (Cannot train without a model)' });
  } else {
    issues.push({ id: 'has-model', severity: 'success', message: 'Model configured' });
  }

  // 3. Train/Test Split
  const splitNode = execNodes.find((n) => title(n) === 'Train/Test Split' || title(n) === 'Stratified Split');
  if (!splitNode) {
    issues.push({ id: 'no-split', severity: 'warning', message: 'No Train/Test Split found (Evaluation may fail)' });
  }

  // 4. Data leakage: scaling applied BEFORE split (graph ancestry, not position!)
  execNodes.filter((n) => ['Standard Scaler', 'MinMax Scaler', 'Robust Scaler'].includes(title(n))).forEach((n) => {
    if (splitNode && !isDownstreamOf(n.id, title(splitNode), nodes, edges)) {
      issues.push({
        id: `scale-leakage-${n.id}`,
        severity: 'error',
        message: 'Data Leakage: Scaling is NOT downstream of the Train/Test Split — refit leakage will inflate scores',
        nodeId: n.id,
      });
    }
  });

  // 5. Data leakage: SMOTE before split
  execNodes.filter((n) => title(n) === 'SMOTE' || title(n) === 'ADASYN').forEach((n) => {
    if (splitNode && !isDownstreamOf(n.id, title(splitNode), nodes, edges)) {
      issues.push({
        id: `smote-leakage-${n.id}`,
        severity: 'error',
        message: 'Data Leakage: SMOTE must come AFTER the Train/Test Split',
        nodeId: n.id,
      });
    }
  });

  // 6. Disconnected nodes
  execNodes.forEach((node) => {
    const data = node.data as MLNodeData;
    const isSource = data.inputs.length === 0;
    const hasIncoming = edges.some((e) => e.target === node.id);
    const hasOutgoing = edges.some((e) => e.source === node.id);

    if (!isSource && !hasIncoming) {
      issues.push({
        id: `disconnected-in-${node.id}`,
        severity: 'warning',
        message: `${data.title} is missing an input connection`,
        nodeId: node.id,
      });
    }
    if (!hasOutgoing && data.category !== 'Evaluation' && data.category !== 'Deployment' && data.category !== 'Model Management') {
      issues.push({
        id: `disconnected-out-${node.id}`,
        severity: 'warning',
        message: `${data.title} is missing an output connection`,
        nodeId: node.id,
      });
    }
  });

  // Health score
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  let healthScore = 100;
  if (errors > 0) healthScore = 20;
  else if (warnings > 0) healthScore = 60 + Math.max(0, 20 - warnings * 5);

  if (execNodes.length === 1 && sourceNode) healthScore = 30;

  return { issues, healthScore };
};