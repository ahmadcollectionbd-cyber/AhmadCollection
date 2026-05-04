import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus } from '../types';

interface OrderState {
  orders: Order[];
  add: (o: Order) => void;
  updateStatus: (id: string, status: OrderStatus, note?: string) => void;
  remove: (id: string) => void;
  byShortId: (shortId: string) => Order | undefined;
  byId: (id: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      add: (o) => set({ orders: [o, ...get().orders] }),
      updateStatus: (id, status, note) =>
        set({
          orders: get().orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  updatedAt: Date.now(),
                  statusHistory: [
                    ...o.statusHistory,
                    { status, at: Date.now(), note },
                  ],
                }
              : o,
          ),
        }),
      remove: (id) => set({ orders: get().orders.filter((o) => o.id !== id) }),
      byShortId: (shortId) =>
        get().orders.find((o) => o.shortId.toLowerCase() === shortId.toLowerCase()),
      byId: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: 'ac-orders' },
  ),
);
