import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, subscribeToSettings } from '../lib/settings';
import type { SiteSettings } from '../types';

interface SettingsState {
  settings: SiteSettings;
  loaded: boolean;
  setSettings: (s: SiteSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      loaded: false,
      setSettings: (s) => set({ settings: s, loaded: true }),
    }),
    { name: 'ac-settings', version: 1 },
  ),
);

let started = false;
let unsub: (() => void) | null = null;

export function startSettingsSubscription() {
  if (started) return;
  started = true;
  unsub = subscribeToSettings((s) => {
    useSettingsStore.getState().setSettings(s);
  });
}

export function stopSettingsSubscription() {
  unsub?.();
  unsub = null;
  started = false;
}

/** Hook that boots the realtime subscription on mount. */
export function useSettingsBoot() {
  useEffect(() => {
    startSettingsSubscription();
    return () => {
      // Keep the subscription alive across mounts; only cleanup on full app unmount.
    };
  }, []);
}
