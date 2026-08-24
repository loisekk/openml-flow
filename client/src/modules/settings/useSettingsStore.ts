// client/src/modules/settings/useSettingsStore.ts
import { create } from 'zustand';
import { useAuthStore } from '../auth/authStore';

export interface AIProvider {
  id: number;
  name: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

export interface AddProviderPayload {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  isActive?: boolean;
}

interface SettingsState {
  providers: AIProvider[];
  isLoading: boolean;
  error: string | null;
  fetchProviders: (token: string) => Promise<void>;
  addProvider: (token: string, data: AddProviderPayload) => Promise<number | null>;
  activateProvider: (token: string, id: number) => Promise<boolean>;
  testProvider: (token: string, baseUrl: string, apiKey: string, model: string) => Promise<{ success: boolean; message: string; baseUrl?: string }>;
  testProviderById: (token: string, id: number) => Promise<{ success: boolean; message: string }>;
  deleteProvider: (token: string, id: number) => Promise<boolean>;
}

/**
 * A 401/403 means the session is dead (expired token, or the token references a
 * user that doesn't exist in the current database — e.g. a fresh Docker volume).
 * Log the user out so the app redirects to login instead of crashing on every
 * subsequent authed request.
 */
const handleAuthFailure = (status: number, detail: string): string => {
  if (status === 401 || status === 403) {
    try { useAuthStore.getState().logout(); } catch { /* non-fatal */ }
    return `Session expired (${detail}). Please log in again.`;
  }
  return `Request failed (${status}): ${detail}`;
};

const extractDetail = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    if (body?.detail) return String(body.detail);
  } catch { /* non-JSON error body */ }
  return `HTTP ${res.status}`;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: [],
  isLoading: false,
  error: null,

  fetchProviders: async (token) => {
    set({ isLoading: true, error: null });
    try {
      // RELATIVE path — routed by Vite dev proxy / Nginx prod proxy. NEVER hardcode a host.
      const res = await fetch('/api/ai/providers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        set({ providers: [], isLoading: false, error: handleAuthFailure(res.status, await extractDetail(res)) });
        return;
      }
      const data = await res.json();
      // GUARD: only arrays reach state — FastAPI errors are {detail: "..."} objects
      set({ providers: Array.isArray(data) ? data : [], isLoading: false, error: null });
    } catch {
      set({ providers: [], isLoading: false, error: 'Could not reach the local runtime.' });
    }
  },

  addProvider: async (token, data) => {
    try {
      const res = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        set({ error: handleAuthFailure(res.status, await extractDetail(res)) });
        return null;
      }
      const created = await res.json();
      await get().fetchProviders(token);
      return typeof created.id === 'number' ? created.id : null;
    } catch {
      set({ error: 'Could not reach the local runtime.' });
      return null;
    }
  },

  activateProvider: async (token, id) => {
    try {
      const res = await fetch(`/api/ai/providers/${id}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        set({ error: handleAuthFailure(res.status, await extractDetail(res)) });
        return false;
      }
      await get().fetchProviders(token);
      return true;
    } catch {
      set({ error: 'Could not reach the local runtime.' });
      return false;
    }
  },

  testProvider: async (token, baseUrl, apiKey, model) => {
    try {
      const res = await fetch('/api/ai/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ baseUrl, apiKey, model }),
      });
      if (!res.ok) return { success: false, message: `Test failed (HTTP ${res.status}).` };
      return await res.json();
    } catch {
      return { success: false, message: 'Could not reach the local runtime.' };
    }
  },

  testProviderById: async (token, id) => {
    try {
      const res = await fetch(`/api/ai/providers/${id}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return { success: false, message: `Test failed (HTTP ${res.status}).` };
      return await res.json();
    } catch {
      return { success: false, message: 'Could not reach the local runtime.' };
    }
  },

  deleteProvider: async (token, id) => {
    try {
      const res = await fetch(`/api/ai/providers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        set({ error: handleAuthFailure(res.status, await extractDetail(res)) });
        return false;
      }
      await get().fetchProviders(token);
      return true;
    } catch {
      set({ error: 'Could not reach the local runtime.' });
      return false;
    }
  },
}));
