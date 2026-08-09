// client/src/modules/settings/useSettingsStore.ts
import { create } from 'zustand';

export interface AIProvider {
  id: number;
  name: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

interface SettingsState {
  providers: AIProvider[];
  fetchProviders: (token: string) => Promise<void>;
  addProvider: (token: string, data: Omit<AIProvider, 'id' | 'isActive'> & { apiKey: string; isActive?: boolean }) => Promise<void>;
  activateProvider: (token: string, id: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: [],
  
  fetchProviders: async (token) => {
    const res = await fetch('http://localhost:3001/api/ai/providers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    set({ providers: data });
  },
  
  addProvider: async (token, data) => {
    await fetch('http://localhost:3001/api/ai/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    await get().fetchProviders(token);
  },
  
  activateProvider: async (token, id) => {
    await fetch(`http://localhost:3001/api/ai/providers/${id}/activate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await get().fetchProviders(token);
  }
}));