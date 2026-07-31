import { create } from 'zustand';

export interface AppState {
  user: { name: string; email: string; avatar: string } | null;
  activePanel: string;
  setUser: (user: { name: string; email: string; avatar: string }) => void;
  logout: () => void;
  setActivePanel: (panel: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  activePanel: 'dashboard',
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, activePanel: 'dashboard' }),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
