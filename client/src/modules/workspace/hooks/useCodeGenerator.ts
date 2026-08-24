// client/src/modules/workspace/hooks/useCodeGenerator.ts
// REACTIVE code generation — re-runs automatically whenever nodes or edges change.
// All real logic lives in utils/codeGeneratorUtils.ts (single source of truth).

import { useMemo } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { buildWorkflowScript } from '../utils/codeGeneratorUtils';

export function useCodeGenerator(): string {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);

  return useMemo(() => buildWorkflowScript(nodes, edges), [nodes, edges]);
}