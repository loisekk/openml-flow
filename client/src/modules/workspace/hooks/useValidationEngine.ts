// client/src/modules/workspace/hooks/useValidationEngine.ts
import { useWorkflowStore } from '../store/workflowStore';

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'success';
  message: string;
  nodeId?: string; // If clicked, focus this node
}

export const useValidationEngine = () => {
  const { nodes, edges } = useWorkflowStore();
  const issues: ValidationIssue[] = [];

  if (nodes.length === 0) {
    return { issues, healthScore: 0 };
  }

  // 1. Check for Data Source
  const hasDataSource = nodes.some(n => n.data.title === 'Load CSV' || n.data.title === 'Sample Dataset' || n.data.title === 'Load JSON');
  const dataSourceNode = nodes.find(n => n.data.title === 'Load CSV' || n.data.title === 'Sample Dataset');
  if (!hasDataSource) {
    issues.push({ id: 'no-source', severity: 'error', message: 'Missing Data Source (Add a Load CSV node)' });
  } else {
    issues.push({ id: 'has-source', severity: 'success', message: 'Data source configured' });
  }

  // 2. Check for Model
  const modelNode = nodes.find(n => n.data.category === 'Modeling');
  if (!modelNode) {
    issues.push({ id: 'no-model', severity: 'warning', message: 'No Model node found (Cannot train without a model)' });
  } else {
    issues.push({ id: 'has-model', severity: 'success', message: 'Model configured' });
  }

  // 3. Check for Train/Test Split
  const splitNode = nodes.find(n => n.data.title === 'Train/Test Split');
  if (!splitNode) {
    issues.push({ id: 'no-split', severity: 'warning', message: 'No Train/Test Split found (Evaluation may fail)' });
  }

  // 4. Data Leakage: Scaling before Split
  const scalingNode = nodes.find(n => n.data.title === 'Column Transformer' || n.data.title === 'Standard Scaling');
  if (scalingNode && splitNode) {
    if (scalingNode.position.y < splitNode.position.y) {
      issues.push({ 
        id: 'scale-leakage', 
        severity: 'error', 
        message: 'Data Leakage: Scaling applied BEFORE Train/Test Split', 
        nodeId: scalingNode.id 
      });
    }
  }

  // 5. Data Leakage: SMOTE before Split
  const smoteNode = nodes.find(n => n.data.title === 'SMOTE Imbalance');
  if (smoteNode && splitNode) {
    if (smoteNode.position.y < splitNode.position.y) {
      issues.push({ 
        id: 'smote-leakage', 
        severity: 'error', 
        message: 'Data Leakage: SMOTE applied BEFORE Train/Test Split', 
        nodeId: smoteNode.id 
      });
    }
  }

  // 6. Disconnected Nodes
  nodes.forEach(node => {
    if (node.data.inputs.length > 0 || node.data.outputs.length > 0) {
      const hasIncoming = edges.some(e => e.target === node.id);
      const hasOutgoing = edges.some(e => e.source === node.id);
      
      // Skip source nodes for incoming check
      const isSource = node.data.inputs.length === 0;
      
      if (!isSource && !hasIncoming) {
        issues.push({ 
          id: `disconnected-in-${node.id}`, 
          severity: 'warning', 
          message: `${node.data.title} is missing an input connection`, 
          nodeId: node.id 
        });
      }
      if (!hasOutgoing && node.data.category !== 'Evaluation') {
        issues.push({ 
          id: `disconnected-out-${node.id}`, 
          severity: 'warning', 
          message: `${node.data.title} is missing an output connection`, 
          nodeId: node.id 
        });
      }
    }
  });

  // Calculate Health Score
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  let healthScore = 100;
  if (errors > 0) healthScore = 20;
  else if (warnings > 0) healthScore = 60 + Math.max(0, 20 - warnings * 5);
  
  // If only 1 node and it's a source, score is 30
  if (nodes.length === 1 && hasDataSource) healthScore = 30;

  return { issues, healthScore };
};