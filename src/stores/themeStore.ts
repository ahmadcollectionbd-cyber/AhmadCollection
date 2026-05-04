import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (t) => {
        set({ theme: t });
        document.documentElement.classList.toggle('dark', t === 'dark');
      },
      toggle: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(next);
      },
    }),
    {
      name: 'ac-theme',
      onRehydrateStorage: () => (state) => {
        if (state)
          document.documentElement.classList.toggle('dark', state.theme === 'dark');
      },
    },
  ),
);
