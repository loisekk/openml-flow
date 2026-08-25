// client/src/modules/workspace/hooks/useExecutionEngine.ts
//
// Execution Engine — orchestrates local Python runs via the FastAPI SSE stream.
//
//   executeWorkflow()  → runs the full generated script (Monaco override wins if set)
//   executeNode(id)    → runs ONE node plus its full EDGE-BASED upstream chain
//
// All stdout protocol lines are intercepted and NEVER shown raw in the console:
//   __MLPIPE_NODE__::{id, title}   → live per-node status on the canvas
//   __MLPIPE_DATA__::{json}        → Data tab payload
//   __MLPIPE_METRICS__::{json}     → Evaluations tab payload
//   __MLPIPE_CHART__::{json}       → Charts tab payload (attributed to the
//                                    currently-running node via the beacon)
//
// Reads store state via getState() at CALL time (no stale closures) and
// guards against concurrent runs via isExecuting.

import { useWorkflowStore } from '../store/workflowStore';
import { useCodeGenerator } from './useCodeGenerator';
import { generateNodeChainScript } from '../utils/codeGeneratorUtils';
import { getExecutionChain } from '../utils/graphUtils';
import { validatePipeline } from '../utils/pipelineValidator';

const NODE_MARKER = '__MLPIPE_NODE__::';
const DATA_MARKER = '__MLPIPE_DATA__::';
const METRICS_MARKER = '__MLPIPE_METRICS__::';
const CHART_MARKER = '__MLPIPE_CHART__::';

/**
 * Standalone single-node runner — used by the WorkflowNode toolbar WITHOUT
 * subscribing to hooks, so React.memo on WorkflowNode keeps working.
 */
export const runNodeById = async (nodeId: string) => {
  const state = useWorkflowStore.getState();
  if (state.isExecuting) return;

  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  state.setExecuting(true);
  state.addExecutionLog(`[INFO] Executing Node: ${node.data.title}...`);

  getExecutionChain(nodeId, state.nodes, state.edges).forEach((n) =>
    state.updateNodeStatus(n.id, 'idle')
  );

  const chainCode = generateNodeChainScript(nodeId, state.nodes, state.edges);

  try {
    const ok = await runStream(chainCode);
    state.updateNodeStatus(nodeId, ok ? 'success' : 'error');
    state.addExecutionLog(
      ok
        ? `[SUCCESS] Node "${node.data.title}" executed successfully.`
        : `[ERROR] Node "${node.data.title}" failed.`
    );
  } catch (error: any) {
    state.updateNodeStatus(nodeId, 'error');
    state.addExecutionLog(`[ERROR] ${error.message}`);
  } finally {
    useWorkflowStore.getState().setExecuting(false);
  }
};

/**
 * Starts a run on the backend and consumes its SSE stream until completion.
 * Resolves `true` if the process exited cleanly, `false` otherwise.
 */
async function runStream(code: string): Promise<boolean> {
  const { addExecutionLog, setExecutionData, setExecutionMetrics, updateNodeStatus, setNodeChart } =
    useWorkflowStore.getState();

  let hasError = false;
  let finished = false;
  let sawMarker = false;
  let currentNodeId: string | null = null;

  const resolveCurrentNode = (status: 'success' | 'error') => {
    if (currentNodeId) {
      updateNodeStatus(currentNodeId, status);
      currentNodeId = null;
    }
  };

  const response = await fetch('/api/run/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new Error('Failed to start execution run');
  const { runId } = await response.json();

  const eventSource = new EventSource(`/api/run/stream/${runId}`);

  eventSource.onmessage = (event) => {
    let log: unknown;
    try {
      log = JSON.parse(event.data);
    } catch {
      addExecutionLog(event.data);
      return;
    }
    if (typeof log !== 'string') {
      addExecutionLog(String(log));
      return;
    }

    // 1. Node beacon → live status + clean console line
    if (log.startsWith(NODE_MARKER)) {
      try {
        const meta = JSON.parse(log.slice(NODE_MARKER.length));
        sawMarker = true;
        resolveCurrentNode('success'); // previous section finished cleanly
        currentNodeId = meta.id;
        updateNodeStatus(meta.id, 'running');
        addExecutionLog(`[INFO] ▶ Running: ${meta.title}...`);
      } catch {
        /* malformed marker — ignore */
      }
      return;
    }

    // 1.5. Chart payload → attributed to the currently-running node (via beacon)
    if (log.startsWith(CHART_MARKER)) {
      try {
        const chart = JSON.parse(log.slice(CHART_MARKER.length));
        if (currentNodeId) {
          setNodeChart(currentNodeId, {
            type: chart.type ?? 'bar',
            title: chart.title ?? 'Chart',
            data: chart,
          });
          addExecutionLog(`[INFO] 📊 Chart ready: ${chart.title ?? 'Chart'}`);
        } else {
          addExecutionLog('[WARN] Chart emitted outside a node section — skipped.');
        }
      } catch {
        addExecutionLog('[ERROR] Failed to parse chart JSON.');
      }
      return;
    }

    // 2. Data preview payload → Data tab
    if (log.startsWith(DATA_MARKER)) {
      try {
        setExecutionData(JSON.parse(log.slice(DATA_MARKER.length)));
        addExecutionLog('[INFO] Data preview captured.');
      } catch {
        addExecutionLog('[ERROR] Failed to parse data preview JSON.');
      }
      return;
    }

    // 3. Metrics payload → Evaluations tab (merged)
    if (log.startsWith(METRICS_MARKER)) {
      try {
        const metrics = JSON.parse(log.slice(METRICS_MARKER.length));
        const existing = useWorkflowStore.getState().executionMetrics || {};
        setExecutionMetrics({ ...existing, ...metrics });
        addExecutionLog('[INFO] ML metrics captured.');
      } catch {
        addExecutionLog('[ERROR] Failed to parse metrics JSON.');
      }
      return;
    }

    // 4. Human-readable output (exit code decides failure, not stderr warnings)
    addExecutionLog(log);
    if (log.includes('[ERROR]')) hasError = true;
  };

  return new Promise<boolean>((resolve) => {
    eventSource.addEventListener('done', (event: any) => {
      if (finished) return;
      finished = true;

      let message = 'Execution finished.';
      try {
        message = JSON.parse(event.data);
      } catch {
        /* keep default */
      }

      const exitMatch = /exit code (\d+)/.exec(String(message));
      if (exitMatch && exitMatch[1] !== '0') hasError = true;

      addExecutionLog(message);

      if (sawMarker) {
        resolveCurrentNode(hasError ? 'error' : 'success');
      } else {
        // No beacons seen: attribute the failure to the FIRST node only
        // (never paint the whole graph red), or mark all green on success.
        const first = useWorkflowStore.getState().nodes.find((n) => n.data.status !== undefined);
        if (hasError && first) {
          updateNodeStatus(first.id, 'error');
        } else if (!hasError) {
          useWorkflowStore.getState().nodes.forEach((n) => updateNodeStatus(n.id, 'success'));
        }
      }

      eventSource.close();
      resolve(!hasError);
    });

    eventSource.onerror = () => {
      if (finished) return;
      finished = true;
      addExecutionLog('[ERROR] Connection to local runtime closed.');
      resolveCurrentNode('error');
      eventSource.close();
      resolve(false);
    };
  });
}

export const useExecutionEngine = () => {
  const isExecuting = useWorkflowStore((s) => s.isExecuting);
  const generatedCode = useCodeGenerator();

  /** Execute the ENTIRE workflow (Code panel content, or Monaco override). */
  const executeWorkflow = async () => {
    const state = useWorkflowStore.getState();
    if (state.isExecuting) return;

    state.clearLogs();
    state.setExecutionData(null);
    state.setExecutionMetrics(null);

    // Pre-flight validation — cycles and disconnected nodes block execution
    const validation = validatePipeline(state.nodes, state.edges);
    if (!validation.valid) {
      validation.errors.forEach((e) => state.addExecutionLog(`[VALIDATION] ${e}`));
      state.addExecutionLog('[INFO] Execution blocked — fix the issues above and try again.');
      return;
    }

    state.setExecuting(true);
    state.nodes.forEach((n) => state.updateNodeStatus(n.id, 'idle'));
    state.addExecutionLog('[INFO] Compiling graph and sending to local runtime...');

    const code = state.customWorkflowCode || generatedCode;

    try {
      await runStream(code);
    } catch (error: any) {
      state.addExecutionLog(`[ERROR] ${error.message}`);
    } finally {
      useWorkflowStore.getState().setExecuting(false);
    }
  };

  /**
   * Execute ONE node Jupyter-style. Thin wrapper over the standalone
   * runNodeById (kept for existing hook-based callers).
   */
  const executeNode = async (nodeId: string) => {
    return runNodeById(nodeId);
  };

  return { executeWorkflow, executeNode, isExecuting };
};