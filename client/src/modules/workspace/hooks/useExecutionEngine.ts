import { useWorkflowStore } from '../store/workflowStore';
import { useCodeGenerator } from './useCodeGenerator';
import { generateSingleNodeCode } from './codeGeneratorUtils';

export const useExecutionEngine = () => {
  const { 
    setExecuting, addExecutionLog, clearLogs, isExecuting, 
    setExecutionData, setExecutionMetrics, customWorkflowCode,
    updateNodeStatus, nodes 
  } = useWorkflowStore();
  
  const generatedCode = useCodeGenerator();
  const pythonCode = customWorkflowCode || generatedCode;

  // Execute Entire Workflow
  const executeWorkflow = async () => {
    if (isExecuting) return;
    
    clearLogs();
    setExecutionData(null);
    setExecutionMetrics(null);
    setExecuting(true);
    addExecutionLog('[INFO] Compiling graph and sending to local runtime...');

    try {
      const response = await fetch('/api/run/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pythonCode })
      });

      if (!response.ok) throw new Error('Failed to start execution run');
      const { runId } = await response.json();

      const eventSource = new EventSource(`/api/run/stream/${runId}`);

      eventSource.onmessage = (event) => {
        try {
          const log = JSON.parse(event.data);
          if (typeof log === 'string' && log.startsWith('__MLPIPE_DATA__::')) {
            const jsonStr = log.replace('__MLPIPE_DATA__::', '');
            try {
              const data = JSON.parse(jsonStr);
              setExecutionData(data);
              addExecutionLog('[INFO] Data preview captured successfully.');
            } catch (parseError) {
              addExecutionLog('[ERROR] Failed to parse data preview JSON.');
            }
          } else if (typeof log === 'string' && log.startsWith('__MLPIPE_METRICS__::')) {
            const jsonStr = log.replace('__MLPIPE_METRICS__::', '');
            try {
              const metrics = JSON.parse(jsonStr);
              const existingMetrics = useWorkflowStore.getState().executionMetrics || {};
              setExecutionMetrics({ ...existingMetrics, ...metrics });
              addExecutionLog('[INFO] ML Metrics captured successfully.');
            } catch (parseError) {
              addExecutionLog('[ERROR] Failed to parse metrics JSON.');
            }
          } else {
            addExecutionLog(log);
          }
        } catch (e) {
          addExecutionLog(event.data);
        }
      };

      eventSource.addEventListener('done', (event: any) => {
        try {
          const log = JSON.parse(event.data);
          addExecutionLog(log);
        } catch (e) {
          addExecutionLog('Execution finished.');
        }
        eventSource.close();
        setExecuting(false);
      });

      eventSource.onerror = () => {
        addExecutionLog('[ERROR] Connection to local runtime closed.');
        eventSource.close();
        setExecuting(false);
      };

    } catch (error: any) {
      addExecutionLog(`[ERROR] ${error.message}`);
      setExecuting(false);
    }
  };

  // Execute Single Node (For Node Studio "Run Node" Button)
  const executeNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    updateNodeStatus(nodeId, 'running');
    addExecutionLog(`[INFO] Executing Node: ${node.data.title}...`);

    const nodeCode = generateSingleNodeCode(node);

    try {
      const response = await fetch('/api/run/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: nodeCode })
      });

      if (!response.ok) throw new Error('Failed to start node execution');
      const { runId } = await response.json();

      const eventSource = new EventSource(`/api/run/stream/${runId}`);
      let hasError = false;

      eventSource.onmessage = (event) => {
        try {
          const log = JSON.parse(event.data);
          addExecutionLog(log);
          if (typeof log === 'string' && log.includes('[STDERR]') || log.includes('[ERROR]')) {
            hasError = true;
          }
        } catch (e) {
          addExecutionLog(event.data);
        }
      };

      eventSource.addEventListener('done', () => {
        if (hasError) {
          updateNodeStatus(nodeId, 'error');
          addExecutionLog(`[ERROR] Node "${node.data.title}" failed.`);
        } else {
          updateNodeStatus(nodeId, 'success');
          addExecutionLog(`[SUCCESS] Node "${node.data.title}" executed successfully.`);
        }
        eventSource.close();
      });

      eventSource.onerror = () => {
        updateNodeStatus(nodeId, 'error');
        addExecutionLog(`[ERROR] Node "${node.data.title}" failed to connect to runtime.`);
        eventSource.close();
      };

    } catch (error: any) {
      updateNodeStatus(nodeId, 'error');
      addExecutionLog(`[ERROR] ${error.message}`);
    }
  };

  return { executeWorkflow, executeNode, isExecuting };
};