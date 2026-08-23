// client/src/modules/workspace/hooks/useAutoSave.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../../auth/authStore';

export const useAutoSave = (workflowId: string) => {
  const { nodes, edges, workflowName, isHydrated, datasetIds } = useWorkflowStore(); // <-- ADDED isHydrated, datasetIds
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Error'>('Saved');

  useEffect(() => {
    // CRITICAL: Do not save if the workflow hasn't been hydrated from the DB yet.
    // This prevents overwriting a saved workflow with an empty `nodes: []` array on refresh.
    if (!isHydrated) return; 
    if (nodes.length === 0 && edges.length === 0 && datasetIds.length === 0) return; 
    
    setSaveStatus('Saving...');

    const debounceTimer = setTimeout(async () => {
      try {
        const isMockId = workflowId.startsWith('wf-') || workflowId === 'new';
        const payloadId = isMockId ? null : parseInt(workflowId);

        const res = await fetch('/api/workflows/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: payloadId,
            name: workflowName || 'Untitled Workflow',
            // INCLUDE datasetIds IN THE GRAPH DATA
            graphData: { nodes, edges, datasetIds } 
          })
        });

        if (!res.ok) throw new Error('Failed to save');
        const data = await res.json();

        if (isMockId && data.id) {
          navigate(`/workspace/${data.id}`, { replace: true });
        }

        setSaveStatus('Saved');
      } catch (err) {
        setSaveStatus('Error');
      }
    }, 1000); // Reduced debounce to 1000ms for snappier saves

    return () => clearTimeout(debounceTimer);
  }, [nodes, edges, workflowId, token, navigate, workflowName, isHydrated, datasetIds]); // <-- ADDED isHydrated, datasetIds

  return saveStatus;
};