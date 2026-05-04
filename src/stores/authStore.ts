import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DemoUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  photoURL?: string;
}

interface AuthState {
  user: DemoUser | null;
  loginAsAdmin: () => void;
  loginAsCustomer: (name: string, email: string) => void;
  loginGoogle: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loginAsAdmin: () =>
        set({
          user: {
            uid: 'admin-demo',
            email: 'admin@ahmadcollection.bd',
            name: 'Admin',
            role: 'admin',
          },
        }),
      loginAsCustomer: (name, email) =>
        set({
          user: { uid: `c-${Date.now()}`, email, name, role: 'customer' },
        }),
      loginGoogle: () =>
        set({
          user: {
            uid: `g-${Date.now()}`,
            email: 'demo.user@gmail.com',
            name: 'Demo User',
            role: 'customer',
            photoURL: 'https://i.pravatar.cc/100?img=12',
          },
        }),
      logout: () => set({ user: null }),
    }),
    { name: 'ac-auth' },
  ),
);
