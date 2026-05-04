import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  add: (p: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1) => {
        const existing = get().items.find((i) => i.productId === p.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === p.id
                ? { ...i, quantity: Math.min(i.stock, i.quantity + qty) }
                : i,
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              {
                productId: p.id,
                name: p.name,
                price: p.price,
                image: p.images[0],
                quantity: Math.max(1, Math.min(p.stock, qty)),
                stock: p.stock,
                slug: p.slug,
              },
            ],
          });
        }
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQty: (productId, qty) =>
        set({
          items: get()
            .items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(1, Math.min(i.stock, qty)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    { name: 'ac-cart' },
  ),
);
