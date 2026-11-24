import { create } from 'zustand';
import api, { setAccessToken } from '../lib/api.js';

let initialization;

export const useAuth = create((set, get) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  initialize: () => {
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        // Clear the legacy cached profile; it is not proof of an authenticated session.
        try { localStorage.removeItem('arya-seva-auth'); } catch {}
        const { data: session } = await api.post('/auth/refresh');
        setAccessToken(session.accessToken);
        const { data } = await api.get('/auth/me');
        set({ user: { id: data.id, email: data.email, role: data.role, fullName: data.fullName, phone: data.phone } });
      } catch {
        setAccessToken(null);
        set({ user: null });
      } finally {
        set({ hydrated: true });
      }
    })();
    return initialization;
  },
  login: async (email, password, otp) => {
    const { data } = await api.post('/auth/login', { email, password, ...(otp ? { otp } : {}) });
    setAccessToken(data.accessToken);
    set({ user: data.user });
    return data.user;
  },
  loginWithGoogle: async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    setAccessToken(data.accessToken);
    set({ user: data.user });
    return data.user;
  },
  register: async (payload) => api.post('/auth/register', payload).then((r) => r.data),
  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    setAccessToken(null);
    set({ user: null });
  },
  refreshUser: async () => {
    if (!get().user) return;
  },
}));
