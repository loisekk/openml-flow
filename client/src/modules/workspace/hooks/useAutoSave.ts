import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../../auth/authStore';

export const useAutoSave = (workflowId: string) => {
  const { nodes, edges, workflowName } = useWorkflowStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Error'>('Saved');

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return; 
    
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
            graphData: { nodes, edges }
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
    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [nodes, edges, workflowId, token, navigate, workflowName]); 

  return saveStatus;
};