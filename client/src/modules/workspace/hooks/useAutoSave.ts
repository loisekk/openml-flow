// client/src/modules/workspace/hooks/useAutoSave.ts
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../../auth/authStore';

const DEBOUNCE_MS = 1000;

export const useAutoSave = (workflowId: string) => {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const isHydrated = useWorkflowStore((s) => s.isHydrated);
  const datasetIds = useWorkflowStore((s) => s.datasetIds);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Error'>('Saved');

  const isMockId = workflowId.startsWith('wf-') || workflowId === 'new';

  // Latest values for the FLUSH — token/workflowId may change after scheduling.
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const workflowIdRef = useRef(workflowId);
  workflowIdRef.current = workflowId;

  useEffect(() => {
    // Guard 1: store must be hydrated (loader sets this for new AND loaded flows).
    if (!isHydrated) return;
    // Guard 2: never persist an empty graph (wipe-race protection on refresh).
    if (nodes.length === 0 && edges.length === 0 && datasetIds.length === 0) return;

    setSaveStatus('Saving...');

    // SNAPSHOT at schedule time, frozen in this closure. The flush below uses
    // THIS — not live store state — so a store reset (navigating away) can
    // never flush an empty graph over the real data.
    const snapshot = { nodes, edges, datasetIds, name: workflowName };
    let completed = false;

    const timer = setTimeout(async () => {
      try {
        const payloadId = isMockId ? null : parseInt(workflowId, 10);
        const res = await fetch('/api/workflows/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            id: Number.isNaN(payloadId as number) ? null : payloadId,
            name: snapshot.name || 'Untitled Workflow',
            graphData: { nodes: snapshot.nodes, edges: snapshot.edges, datasetIds: snapshot.datasetIds },
          }),
        });
        if (!res.ok) throw new Error('Failed to save');
        const data = await res.json();
        completed = true;
        // Promote mock ids ('new', legacy 'wf-*') to the real numeric DB id.
        if (isMockId && data.id) {
          navigate(`/workspace/${data.id}`, { replace: true });
        }
        setSaveStatus('Saved');
      } catch {
        if (!completed) setSaveStatus('Error');
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      // FLUSH: if the debounce never completed (user navigated away within
      // the window), persist the SCHEDULED snapshot. keepalive lets the
      // request survive the unmount/navigation.
      if (completed) return;
      const t = tokenRef.current;
      if (!t) return;
      const wid = workflowIdRef.current;
      const pid = wid.startsWith('wf-') || wid === 'new' ? null : parseInt(wid, 10);
      fetch('/api/workflows/save', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({
          id: pid !== null && !Number.isNaN(pid) ? pid : null,
          name: snapshot.name || 'Untitled Workflow',
          graphData: { nodes: snapshot.nodes, edges: snapshot.edges, datasetIds: snapshot.datasetIds },
        }),
      }).catch(() => { /* fire-and-forget: best-effort flush */ });
    };
  }, [nodes, edges, workflowId, token, navigate, isHydrated, datasetIds, workflowName, isMockId]);

  return saveStatus;
};