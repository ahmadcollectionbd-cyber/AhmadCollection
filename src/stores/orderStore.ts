import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import {
  addOrderDoc,
  updateOrderStatusDoc,
  watchAllOrders,
  watchOrdersForUser,
} from '../lib/firestore';
import { isFirebaseConfigured } from '../lib/firebase';
import { reportFirestoreError } from './firestoreStatusStore';
import type { Order, OrderStatus } from '../types';
import { useAuthStore } from './authStore';

interface OrderState {
  orders: Order[];
  set: (o: Order[]) => void;
  add: (o: Order) => Promise<void>;
  updateStatus: (id: string, status: OrderStatus, note?: string) => Promise<void>;
  remove: (id: string) => void;
  byShortId: (shortId: string) => Order | undefined;
  byId: (id: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      set: (o) => set({ orders: o }),
      add: async (o) => {
        set({ orders: [o, ...get().orders] });
        if (isFirebaseConfigured) {
          try {
            await addOrderDoc(o);
          } catch (e) {
            reportFirestoreError('orders.create', e);
            toast.error(
              "Order saved locally but didn't sync to admin. " +
                'Make sure Firestore rules are deployed.',
              { duration: 6000 },
            );
          }
        }
      },
      updateStatus: async (id, status, note) => {
        const order = get().orders.find((o) => o.id === id);
        if (!order) return;
        const history = [...order.statusHistory, { status, at: Date.now(), note }];
        set({
          orders: get().orders.map((o) =>
            o.id === id
              ? { ...o, status, updatedAt: Date.now(), statusHistory: history }
              : o,
          ),
        });
        if (isFirebaseConfigured) {
          try {
            await updateOrderStatusDoc(id, status, history);
          } catch (e) {
            reportFirestoreError('orders.update', e);
            toast.error(
              "Status didn't sync — Firestore rules may not allow this update.",
              { duration: 5000 },
            );
          }
        }
      },
      remove: (id) => set({ orders: get().orders.filter((o) => o.id !== id) }),
      byShortId: (shortId) =>
        get().orders.find(
          (o) => o.shortId.toLowerCase() === shortId.toLowerCase(),
        ),
      byId: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: 'ac-orders' },
  ),
);

let started = false;
let unsub: (() => void) | null = null;

/** Switches the live subscription based on current auth (admin → all, customer → own). */
export function startOrderSubscription() {
  const refresh = () => {
    unsub?.();
    unsub = null;
    if (!isFirebaseConfigured) return;
    const user = useAuthStore.getState().user;
    if (!user) return;
    if (user.role === 'admin') {
      unsub = watchAllOrders((items) => useOrderStore.getState().set(items));
    } else {
      unsub = watchOrdersForUser(user.uid, (items) =>
        useOrderStore.getState().set(items),
      );
    }
  };

  if (started) {
    refresh();
    return;
  }
  started = true;
  refresh();

  // Re-subscribe whenever the auth user changes.
  useAuthStore.subscribe((state, prev) => {
    if (state.user?.uid !== prev.user?.uid || state.user?.role !== prev.user?.role) {
      refresh();
    }
  });
}

export function useOrderBoot() {
  useEffect(() => {
    startOrderSubscription();
  }, []);
}
