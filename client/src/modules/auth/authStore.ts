import { create } from 'zustand';

const API_BASE = 'http://localhost:3001/api';

interface AuthState {
  token: string | null;
  username: string | null;
  isModalOpen: boolean;
  initAuth: () => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('mlpipe_token'),
  username: localStorage.getItem('mlpipe_user'),
  isModalOpen: false,

  initAuth: () => {
    const token = localStorage.getItem('mlpipe_token');
    const username = localStorage.getItem('mlpipe_user');
    if (token && username) {
      set({ token, username, isModalOpen: false });
    }
  },

  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('mlpipe_token', data.token);
      localStorage.setItem('mlpipe_user', data.username);
      set({ token: data.token, username: data.username, isModalOpen: false });
      return true;
    }
    return false;
  },

  register: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.ok;
  },

  logout: () => {
    localStorage.removeItem('mlpipe_token');
    localStorage.removeItem('mlpipe_user');
    set({ token: null, username: null });
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));