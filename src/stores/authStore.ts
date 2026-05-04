import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthRole = 'admin' | 'customer';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: AuthRole;
  photoURL?: string;
}

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setHydrated: (hydrated: boolean) => void;
  /** Local-only logout (used by Account page). Real Firebase signOut is handled by lib/auth.ts. */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setUser: (user) => set({ user, hydrated: true }),
      setHydrated: (hydrated) => set({ hydrated }),
      logout: () => set({ user: null }),
    }),
    { name: 'ac-auth' },
  ),
);
