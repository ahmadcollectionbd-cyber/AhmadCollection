import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CrateOption, Product, ProductVariant } from '../types';

interface AddOptions {
  variant?: ProductVariant;
  crate?: CrateOption;
}

interface CartState {
  items: CartItem[];
  /**
   * Add a product to the cart.
   *  - For standard / clothing: pass `qty` as units (integer).
   *  - For per-kg `food` (`product.pricedPerKg === true`): `qty` is kilograms.
   *
   * Optional `extras` carries the chosen variant (clothing size / food
   * pack) and crate (kerat) packaging surcharge.
   */
  add: (p: Product, qty?: number, extras?: AddOptions) => void;
  /** Remove a single cart line, identified by `cartLineKey(item)`. */
  remove: (lineKey: string) => void;
  /** Set the quantity of a single cart line, identified by `cartLineKey(item)`. */
  setQty: (lineKey: string, qty: number) => void;
  /**
   * Patch a single cart line in-place (e.g. switch crate option without
   * dropping & re-adding it). Identified by `cartLineKey(item)`.
   */
  patchLine: (lineKey: string, patch: Partial<CartItem>) => void;
  clear: () => void;
  count: () => number;
  /** Sum of (price × quantity) over all lines, plus per-line crate price. */
  subtotal: () => number;
  /** Sum of crate (kerat) prices across all lines. */
  crateTotal: () => number;
}

/**
 * Stable composite key for a cart line. Two lines with the same product
 * but different variants (e.g. clothing in size M vs L) are kept apart
 * so the customer can order both. Crate is intentionally NOT in the
 * key so the customer can switch crates on the same line.
 */
export function cartLineKey(item: Pick<CartItem, 'productId' | 'variantId'>): string {
  return `${item.productId}|${item.variantId ?? ''}`;
}

/**
 * Resolve effective price per kg for a per-kg `food` product, picking
 * the highest-`minKg` weight tier that the order qualifies for. Falls
 * back to `product.price` when no tier matches.
 */
export function effectivePricePerKg(p: Product, kg: number): number {
  if (!p.pricedPerKg) return p.price;
  const tiers = (p.weightTiers ?? []).slice().sort((a, b) => a.minKg - b.minKg);
  let rate = p.price;
  for (const t of tiers) {
    if (kg >= t.minKg) rate = t.pricePerKg;
  }
  return rate;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1, extras) => {
        const variant = extras?.variant;
        const crate = extras?.crate;
        const key = cartLineKey({ productId: p.id, variantId: variant?.id });
        const stock = variant ? variant.stock : p.stock;

        if (p.pricedPerKg) {
          // For per-kg lines, `qty` is kilograms. Cap at total available kg.
          const minKg = p.minOrderKg ?? 1;
          const desiredKg = Math.max(minKg, Math.min(stock || qty, qty));
          const price = effectivePricePerKg(p, desiredKg);
          const existing = get().items.find((i) => cartLineKey(i) === key);
          if (existing) {
            const merged = Math.max(minKg, Math.min(stock || (existing.quantity + desiredKg), existing.quantity + desiredKg));
            set({
              items: get().items.map((i) =>
                cartLineKey(i) === key
                  ? {
                      ...i,
                      quantity: merged,
                      weightKg: merged,
                      price: effectivePricePerKg(p, merged),
                      crateId: crate?.id ?? i.crateId,
                      crateLabel: crate?.label ?? i.crateLabel,
                      cratePrice: crate?.price ?? i.cratePrice,
                    }
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
                  image: p.images[0],
                  quantity: desiredKg,
                  stock: stock || desiredKg,
                  slug: p.slug,
                  productType: p.type,
                  weightKg: desiredKg,
                  crateId: crate?.id,
                  crateLabel: crate?.label,
                  cratePrice: crate?.price,
                },
              ],
            });
          }
          return;
        }

        // Standard / clothing path.
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
            .items.map((i) => {
              if (cartLineKey(i) !== lineKey) return i;
              const isPerKg = i.productType === 'food' && typeof i.weightKg === 'number';
              if (isPerKg) {
                const next = Math.max(0.5, Math.min(i.stock || qty, qty));
                return { ...i, quantity: next, weightKg: next };
              }
              return { ...i, quantity: Math.max(1, Math.min(i.stock, qty)) };
            })
            .filter((i) => i.quantity > 0),
        }),
      patchLine: (lineKey, patch) =>
        set({
          items: get().items.map((i) =>
            cartLineKey(i) === lineKey ? { ...i, ...patch } : i,
          ),
        }),
      clear: () => set({ items: [] }),
      count: () =>
        get().items.reduce((acc, i) => {
          // Per-kg lines count as one cart entry, not as the kg number.
          if (i.productType === 'food' && typeof i.weightKg === 'number') return acc + 1;
          return acc + i.quantity;
        }, 0),
      subtotal: () =>
        get().items.reduce(
          (acc, i) => acc + i.price * i.quantity + (i.cratePrice ?? 0),
          0,
        ),
      crateTotal: () => get().items.reduce((acc, i) => acc + (i.cratePrice ?? 0), 0),
    }),
    { name: 'ac-cart' },
  ),
);
