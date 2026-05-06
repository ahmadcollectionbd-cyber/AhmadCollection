import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant } from '../types';

interface CartState {
  items: CartItem[];
  /**
   * Add a product to the cart. Pass `variant` for products that have
   * size / weight variants — each variant gets its own line so the
   * customer can buy multiple sizes of the same product.
   */
  add: (p: Product, qty?: number, variant?: ProductVariant) => void;
  /** Remove a single cart line, identified by `cartLineKey(item)`. */
  remove: (lineKey: string) => void;
  /** Set the quantity of a single cart line, identified by `cartLineKey(item)`. */
  setQty: (lineKey: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

/**
 * Stable composite key for a cart line. Two lines with the same product
 * but different variants (e.g. clothing in size M vs L) are kept apart
 * so the customer can order both.
 */
export function cartLineKey(item: Pick<CartItem, 'productId' | 'variantId'>): string {
  return `${item.productId}|${item.variantId ?? ''}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1, variant) => {
        const key = cartLineKey({ productId: p.id, variantId: variant?.id });
        const stock = variant ? variant.stock : p.stock;
        const price = variant?.price ?? p.price;
        const existing = get().items.find((i) => cartLineKey(i) === key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              cartLineKey(i) === key
                ? { ...i, quantity: Math.min(stock, i.quantity + qty) }
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
                price,
                image: variant?.image || p.images[0],
                quantity: Math.max(1, Math.min(stock, qty)),
                stock,
                slug: p.slug,
                productType: p.type,
                variantId: variant?.id,
                variantLabel: variant?.label,
              },
            ],
          });
        }
      },
      remove: (lineKey) =>
        set({ items: get().items.filter((i) => cartLineKey(i) !== lineKey) }),
      setQty: (lineKey, qty) =>
        set({
          items: get()
            .items.map((i) =>
              cartLineKey(i) === lineKey
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
