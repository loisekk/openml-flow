// client/src/modules/auth/authStore.ts
import { create } from 'zustand';

// RELATIVE path — routed by the Vite dev proxy in development and the Nginx
// /api proxy in production. NEVER hardcode an absolute backend host here: it
// breaks every deployment where only port 8080 is exposed.
const API_BASE = '/api';

const TOKEN_KEY = 'mlpipe_token';
const USER_KEY = 'mlpipe_user';

interface AuthState {
  token: string | null;
  username: string | null;
  isModalOpen: boolean;
  initAuth: () => void;
  /** Returns null on success, or a user-readable error message. Never throws. */
  login: (username: string, password: string) => Promise<string | null>;
  /** Returns null on success, or a user-readable error message. Never throws. */
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const NETWORK_ERROR = 'Cannot reach the local runtime. Is the backend running?';

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  username: localStorage.getItem(USER_KEY),
  isModalOpen: false,

  initAuth: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const username = localStorage.getItem(USER_KEY);
    if (token && username) {
      set({ token, username, isModalOpen: false });
    }
  },

  login: async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        return res.status === 401
          ? 'Invalid username or password.'
          : `Login failed (HTTP ${res.status}).`;
      }
      const data = await res.json();
      if (!data?.token || !data?.username) {
        return 'Login response was malformed. Please try again.';
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, data.username);
      set({ token: data.token, username: data.username, isModalOpen: false });
      return null; // success
    } catch {
      return NETWORK_ERROR;
    }
  },

  register: async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        return res.status === 409
          ? 'Username already exists.'
          : `Registration failed (HTTP ${res.status}).`;
      }
      return null; // success
    } catch {
      return NETWORK_ERROR;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, username: null });
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));