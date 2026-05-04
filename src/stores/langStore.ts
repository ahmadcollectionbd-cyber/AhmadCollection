import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';
import type { Lang } from '../types';

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (l) => {
        set({ lang: l });
        i18n.changeLanguage(l);
      },
    }),
    {
      name: 'ac-lang',
      onRehydrateStorage: () => (state) => {
        if (state) i18n.changeLanguage(state.lang);
      },
    },
  ),
);
