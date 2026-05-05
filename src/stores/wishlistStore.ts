import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncUserWishlist, watchUserWishlist } from '../lib/firestore';
import { isFirebaseConfigured } from '../lib/firebase';
import { useAuthStore } from './authStore';

interface WishlistState {
  ids: string[];
  /** True once we have loaded the cloud copy for the current signed-in user. */
  hydrated: boolean;
  set: (ids: string[]) => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      set: (ids) => set({ ids: Array.from(new Set(ids)) }),
      toggle: (id) => {
        const next = get().ids.includes(id)
          ? get().ids.filter((x) => x !== id)
          : [...get().ids, id];
        set({ ids: next });
        // Best-effort cloud sync — only meaningful when signed in.
        const user = useAuthStore.getState().user;
        if (user && isFirebaseConfigured) {
          syncUserWishlist(user.uid, next).catch(() => {});
        }
      },
      has: (id) => get().ids.includes(id),
      clear: () => {
        set({ ids: [] });
        const user = useAuthStore.getState().user;
        if (user && isFirebaseConfigured) {
          syncUserWishlist(user.uid, []).catch(() => {});
        }
      },
    }),
    { name: 'ac-wishlist' },
  ),
);

let started = false;
let unsub: (() => void) | null = null;

/**
 * Subscribe to the signed-in user's cloud wishlist so admin-side product
 * removals or multi-device usage stay consistent. On logout, just clears
 * the in-memory `hydrated` flag — the local persisted copy is untouched
 * so a logged-out shopper still sees their wishlist.
 */
export function startWishlistSubscription() {
  const refresh = () => {
    unsub?.();
    unsub = null;
    if (!isFirebaseConfigured) {
      useWishlistStore.setState({ hydrated: true });
      return;
    }
    const user = useAuthStore.getState().user;
    if (!user) {
      useWishlistStore.setState({ hydrated: false });
      return;
    }
    // First push: seed Firestore with whatever the local store currently
    // holds so a brand-new account inherits the guest's wishlist.
    syncUserWishlist(user.uid, useWishlistStore.getState().ids).catch(() => {});
    unsub = watchUserWishlist(user.uid, (ids) => {
      useWishlistStore.setState({ ids: Array.from(new Set(ids)), hydrated: true });
    });
  };

  if (started) {
    refresh();
    return;
  }
  started = true;
  refresh();

  useAuthStore.subscribe((state, prev) => {
    if (state.user?.uid !== prev.user?.uid) refresh();
  });
}

export function useWishlistBoot() {
  useEffect(() => {
    startWishlistSubscription();
  }, []);
}
