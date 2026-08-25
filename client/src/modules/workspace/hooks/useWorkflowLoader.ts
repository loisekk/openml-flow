// client/src/modules/workspace/hooks/useWorkflowLoader.ts
import { useEffect, useRef } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../../auth/authStore';

export const isMockWorkflowId = (id: string): boolean =>
  id === 'new' || id.startsWith('wf-');

/**
 * Hydrates the workspace store from the route's workflowId. Runs once per ID.
 *  • Numeric id → loads the saved workflow from the backend (setGraph).
 *  • 'new' / legacy 'wf-*' → bootstraps an EMPTY workflow AND marks the store
 *    hydrated, so useAutoSave is allowed to save it.
 *
 * This resolves the old catch-22: autosave waited for isHydrated, but
 * isHydrated only became true on LOAD — so new workflows were never saved
 * and their nodes vanished when navigating away.
 */
export function useWorkflowLoader(workflowId: string) {
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!workflowId || loadedFor.current === workflowId) return;
    loadedFor.current = workflowId;

    const bootstrapEmpty = () =>
      useWorkflowStore.getState().setGraph(workflowId, [], []);

    if (isMockWorkflowId(workflowId)) {
      bootstrapEmpty(); // marks hydrated → autosave unlocked
      return;
    }

    const numericId = parseInt(workflowId, 10);
    if (Number.isNaN(numericId)) {
      bootstrapEmpty();
      return;
    }

    (async () => {
      const token = useAuthStore.getState().token;
      try {
        const res = await fetch(`/api/workflows/load/${numericId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const g = data.graphData ?? {};
        useWorkflowStore.getState().setGraph(
          String(data.id ?? numericId),
          g.nodes ?? [],
          g.edges ?? [],
          g.datasetIds ?? [],
          data.name ?? 'Untitled Workflow'
        );
      } catch {
        // Deleted / unreachable — fall back to an empty canvas, never crash.
        bootstrapEmpty();
      }
    })();
  }, [workflowId]);
}