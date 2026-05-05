import { useEffect } from 'react';
import { create } from 'zustand';
import toast from 'react-hot-toast';
import {
  addOrderDoc,
  deleteOrderDoc,
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
  /** Admin-only: delete one order from Firestore + local store. */
  deleteOrder: (id: string) => Promise<void>;
  /** Admin-only: bulk delete by id. Best-effort, errors swallowed. */
  deleteMany: (ids: string[]) => Promise<{ ok: number; failed: number }>;
  byShortId: (shortId: string) => Order | undefined;
  byId: (id: string) => Order | undefined;
}

// IMPORTANT: orders are intentionally NOT persisted to localStorage. The
// previous `persist({ name: 'ac-orders' })` wrapper made the user's view of
// their order history start from a stale snapshot (often containing the
// PREVIOUS signed-in user's data on a shared device, or pre-update statuses
// after the admin already changed them). Customers reported "old history
// flashes before the new one loads" and "admin status changes never reach my
// account" — both are symptoms of the persisted snapshot fighting with the
// Firestore subscription. We now rely entirely on the live snapshot from
// `watchOrdersForUser` / `watchAllOrders`; the array is empty until the first
// snapshot arrives.
export const useOrderStore = create<OrderState>()(
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
      deleteOrder: async (id) => {
        set({ orders: get().orders.filter((o) => o.id !== id) });
        if (!isFirebaseConfigured) return;
        try {
          await deleteOrderDoc(id);
        } catch (e) {
          reportFirestoreError('orders.delete', e);
          throw e;
        }
      },
      deleteMany: async (ids) => {
        // Optimistically remove from local store first so the UI updates
        // even if Firestore takes a moment.
        const set_ = new Set(ids);
        set({ orders: get().orders.filter((o) => !set_.has(o.id)) });
        if (!isFirebaseConfigured) {
          return { ok: ids.length, failed: 0 };
        }
        let ok = 0;
        let failed = 0;
        await Promise.all(
          ids.map((id) =>
            deleteOrderDoc(id)
              .then(() => {
                ok += 1;
              })
              .catch((e) => {
                failed += 1;
                reportFirestoreError('orders.delete', e);
              }),
          ),
        );
        return { ok, failed };
      },
      byShortId: (shortId) =>
        get().orders.find(
          (o) => o.shortId.toLowerCase() === shortId.toLowerCase(),
        ),
      byId: (id) => get().orders.find((o) => o.id === id),
    }),
);

let started = false;
let unsub: (() => void) | null = null;

/** Switches the live subscription based on current auth (admin → all, customer → own). */
export function startOrderSubscription() {
  const refresh = () => {
    unsub?.();
    unsub = null;
    // Always wipe whatever was in the store before re-subscribing. Without
    // this, switching from admin → customer (or one customer → another on a
    // shared device) would leak the previous user's orders into the new
    // user's UI for the moment between subscriptions.
    useOrderStore.getState().set([]);
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
