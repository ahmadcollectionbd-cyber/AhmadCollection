import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { banners as seedBanners, categories as seedCategories, coupons as seedCoupons, products as seedProducts } from '../data/seed';
import type { Banner, Category, Coupon, NotificationItem, Product, Review } from '../types';

interface DataState {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  coupons: Coupon[];
  reviews: Review[];
  notifications: NotificationItem[];

  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;

  addCategory: (c: Category) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  addCoupon: (c: Coupon) => void;
  updateCoupon: (id: string, patch: Partial<Coupon>) => void;
  removeCoupon: (id: string) => void;

  addReview: (r: Review) => void;
  pushNotification: (n: NotificationItem) => void;
  markNotificationsRead: () => void;

  reset: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      categories: seedCategories,
      banners: seedBanners,
      coupons: seedCoupons,
      reviews: [],
      notifications: [
        {
          id: 'welcome',
          title: 'Welcome to Ahmad Collection',
          body: 'Use code WELCOME10 for 10% off your first order.',
          read: false,
          createdAt: Date.now(),
        },
      ],

      addProduct: (p) => set({ products: [p, ...get().products] }),
      updateProduct: (id, patch) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
        }),
      removeProduct: (id) =>
        set({ products: get().products.filter((p) => p.id !== id) }),

      addCategory: (c) => set({ categories: [c, ...get().categories] }),
      updateCategory: (id, patch) =>
        set({
          categories: get().categories.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        }),
      removeCategory: (id) =>
        set({ categories: get().categories.filter((c) => c.id !== id) }),

      addCoupon: (c) => set({ coupons: [c, ...get().coupons] }),
      updateCoupon: (id, patch) =>
        set({
          coupons: get().coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }),
      removeCoupon: (id) =>
        set({ coupons: get().coupons.filter((c) => c.id !== id) }),

      addReview: (r) =>
        set({
          reviews: [r, ...get().reviews],
          products: get().products.map((p) =>
            p.id === r.productId
              ? {
                  ...p,
                  reviewsCount: p.reviewsCount + 1,
                  rating:
                    Math.round(
                      ((p.rating * p.reviewsCount + r.rating) /
                        (p.reviewsCount + 1)) *
                        10,
                    ) / 10,
                  updatedAt: Date.now(),
                }
              : p,
          ),
        }),

      pushNotification: (n) =>
        set({ notifications: [n, ...get().notifications].slice(0, 30) }),
      markNotificationsRead: () =>
        set({
          notifications: get().notifications.map((n) => ({ ...n, read: true })),
        }),

      reset: () =>
        set({
          products: seedProducts,
          categories: seedCategories,
          banners: seedBanners,
          coupons: seedCoupons,
          reviews: [],
        }),
    }),
    { name: 'ac-data', version: 1 },
  ),
);
