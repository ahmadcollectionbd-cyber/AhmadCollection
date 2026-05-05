import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  banners as seedBanners,
  categories as seedCategories,
  coupons as seedCoupons,
  products as seedProducts,
} from '../data/seed';
import {
  addReviewDoc,
  deleteBanner as deleteBannerDoc,
  deleteCategory as deleteCategoryDoc,
  deleteCoupon as deleteCouponDoc,
  deleteProduct as deleteProductDoc,
  seedDefaultData,
  upsertBanner as upsertBannerDoc,
  upsertCategory as upsertCategoryDoc,
  upsertCoupon as upsertCouponDoc,
  upsertProduct as upsertProductDoc,
  watchBanners,
  watchCategories,
  watchCoupons,
  watchProducts,
  watchReviews,
} from '../lib/firestore';
import { isFirebaseConfigured } from '../lib/firebase';
import type { Banner, Category, Coupon, NotificationItem, Product, Review } from '../types';

interface DataState {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  coupons: Coupon[];
  reviews: Review[];
  notifications: NotificationItem[];
  /** True once at least one realtime snapshot has arrived. */
  ready: boolean;

  setProducts: (p: Product[]) => void;
  setCategories: (c: Category[]) => void;
  setBanners: (b: Banner[]) => void;
  setCoupons: (c: Coupon[]) => void;
  setReviews: (r: Review[]) => void;
  setReady: (b: boolean) => void;

  addProduct: (p: Product) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;

  addCategory: (c: Category) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  addBanner: (b: Banner) => Promise<void>;
  updateBanner: (id: string, patch: Partial<Banner>) => Promise<void>;
  removeBanner: (id: string) => Promise<void>;

  addCoupon: (c: Coupon) => Promise<void>;
  updateCoupon: (id: string, patch: Partial<Coupon>) => Promise<void>;
  removeCoupon: (id: string) => Promise<void>;

  addReview: (r: Review) => Promise<void>;
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
      ready: false,

      setProducts: (p) => set({ products: p }),
      setCategories: (c) => set({ categories: c }),
      setBanners: (b) => set({ banners: b }),
      setCoupons: (c) => set({ coupons: c }),
      setReviews: (r) => set({ reviews: r }),
      setReady: (b) => set({ ready: b }),

      addProduct: async (p) => {
        const next = { ...p, updatedAt: Date.now() };
        set({ products: [next, ...get().products] });
        if (isFirebaseConfigured) await upsertProductDoc(next);
      },
      updateProduct: async (id, patch) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
        });
        const merged = get().products.find((p) => p.id === id);
        if (merged && isFirebaseConfigured) await upsertProductDoc(merged);
      },
      removeProduct: async (id) => {
        set({ products: get().products.filter((p) => p.id !== id) });
        if (isFirebaseConfigured) await deleteProductDoc(id);
      },

      addCategory: async (c) => {
        set({ categories: [c, ...get().categories] });
        if (isFirebaseConfigured) await upsertCategoryDoc(c);
      },
      updateCategory: async (id, patch) => {
        set({
          categories: get().categories.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        });
        const merged = get().categories.find((c) => c.id === id);
        if (merged && isFirebaseConfigured) await upsertCategoryDoc(merged);
      },
      removeCategory: async (id) => {
        set({ categories: get().categories.filter((c) => c.id !== id) });
        if (isFirebaseConfigured) await deleteCategoryDoc(id);
      },

      addBanner: async (b) => {
        set({ banners: [b, ...get().banners] });
        if (isFirebaseConfigured) await upsertBannerDoc(b);
      },
      updateBanner: async (id, patch) => {
        set({
          banners: get().banners.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        });
        const merged = get().banners.find((b) => b.id === id);
        if (merged && isFirebaseConfigured) await upsertBannerDoc(merged);
      },
      removeBanner: async (id) => {
        set({ banners: get().banners.filter((b) => b.id !== id) });
        if (isFirebaseConfigured) await deleteBannerDoc(id);
      },

      addCoupon: async (c) => {
        set({ coupons: [c, ...get().coupons] });
        if (isFirebaseConfigured) await upsertCouponDoc(c);
      },
      updateCoupon: async (id, patch) => {
        set({
          coupons: get().coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        });
        const merged = get().coupons.find((c) => c.id === id);
        if (merged && isFirebaseConfigured) await upsertCouponDoc(merged);
      },
      removeCoupon: async (id) => {
        set({ coupons: get().coupons.filter((c) => c.id !== id) });
        if (isFirebaseConfigured) await deleteCouponDoc(id);
      },

      addReview: async (r) => {
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
        });
        if (isFirebaseConfigured) {
          await addReviewDoc(r);
          const updated = get().products.find((p) => p.id === r.productId);
          if (updated) await upsertProductDoc(updated);
        }
      },

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
    { name: 'ac-data', version: 2 },
  ),
);

let dataStarted = false;
let unsubs: Array<() => void> = [];

export function startDataSubscriptions() {
  if (dataStarted) return;
  dataStarted = true;
  if (!isFirebaseConfigured) {
    useDataStore.getState().setReady(true);
    return;
  }

  // Seed Firestore with the bundled defaults if a fresh project — fire and forget.
  seedDefaultData({
    products: seedProducts,
    categories: seedCategories,
    banners: seedBanners,
    coupons: seedCoupons,
  }).catch(() => {
    /* writes will fail unless an admin is signed in; that's fine */
  });

  unsubs.push(
    watchProducts((items) => {
      if (items.length) useDataStore.getState().setProducts(items);
      useDataStore.getState().setReady(true);
    }),
    watchCategories((items) => {
      if (items.length) useDataStore.getState().setCategories(items);
    }),
    watchBanners((items) => {
      if (items.length) useDataStore.getState().setBanners(items);
    }),
    watchCoupons((items) => {
      if (items.length) useDataStore.getState().setCoupons(items);
    }),
    watchReviews((items) => useDataStore.getState().setReviews(items)),
  );
}

export function stopDataSubscriptions() {
  unsubs.forEach((u) => u());
  unsubs = [];
  dataStarted = false;
}

export function useDataBoot() {
  useEffect(() => {
    startDataSubscriptions();
  }, []);
}
