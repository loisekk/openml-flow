// client/src/modules/dashboard/useDashboardStore.ts
import { create } from 'zustand';

export interface Workflow {
  id: number;            // REAL backend ID — routes as /workspace/{id}
  name: string;
  description: string;
  status: 'Active' | 'Draft';
  updatedAt: string;     // humanized ("2 mins ago")
  executions: number;
  successRate: number;
  nodeCount: number;
}

interface DashboardState {
  workflows: Workflow[];
  isLoading: boolean;
  error: string | null;
  fetchWorkflows: (token: string) => Promise<void>;
  createWorkflow: (token: string, name?: string) => Promise<number | null>;
  deleteWorkflow: (token: string, id: number) => Promise<boolean>;
}

/** SQLite CURRENT_TIMESTAMP is UTC "YYYY-MM-DD HH:MM:SS" → human string. */
function humanizeUpdatedAt(sqliteTs: string | null): string {
  if (!sqliteTs) return '—';
  const iso = sqliteTs.trim().replace(' ', 'T') + 'Z';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return sqliteTs;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  workflows: [],
  isLoading: false,
  error: null,

  fetchWorkflows: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/workflows', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        set({
          isLoading: false,
          workflows: [],
          error: res.status === 401 || res.status === 403
            ? 'Session expired — please log in again.'
            : `Failed to load workflows (HTTP ${res.status}).`,
        });
        return;
      }
      const rows = await res.json();
      const list: Workflow[] = (Array.isArray(rows) ? rows : []).map((r: any) => ({
        id: Number(r.id),
        name: r.name || 'Untitled Workflow',
        description: r.nodeCount > 0
          ? `Pipeline with ${r.nodeCount} node${r.nodeCount === 1 ? '' : 's'}.`
          : 'Empty pipeline — open to start building.',
        status: r.nodeCount > 0 ? 'Active' : 'Draft',
        updatedAt: humanizeUpdatedAt(r.updated_at),
        executions: 0,
        successRate: 0,
        nodeCount: Number(r.nodeCount ?? 0),
      }));
      set({ workflows: list, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, workflows: [], error: 'Could not reach the local runtime.' });
    }
  },

  createWorkflow: async (token, name) => {
    try {
      const res = await fetch('/api/workflows/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: null,
          name: name || 'Untitled Workflow',
          graphData: { nodes: [], edges: [], datasetIds: [] },
        }),
      });
      if (!res.ok) {
        set({ error: `Failed to create workflow (HTTP ${res.status}).` });
        return null;
      }
      const data = await res.json();
      await get().fetchWorkflows(token);
      return typeof data.id === 'number' ? data.id : null;
    } catch {
      set({ error: 'Could not reach the local runtime.' });
      return null;
    }
  },

  deleteWorkflow: async (token, id) => {
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        set({ error: `Failed to delete workflow (HTTP ${res.status}).` });
        return false;
      }
      set({ workflows: get().workflows.filter((wf) => wf.id !== id) });
      return true;
    } catch {
      set({ error: 'Could not reach the local runtime.' });
      return false;
    }
  },
}));