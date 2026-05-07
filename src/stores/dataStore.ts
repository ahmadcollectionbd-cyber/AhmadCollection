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
  deleteAnnouncement as deleteAnnouncementDoc,
  deleteBanner as deleteBannerDoc,
  deleteCategory as deleteCategoryDoc,
  deleteCoupon as deleteCouponDoc,
  deleteProduct as deleteProductDoc,
  seedDefaultData,
  upsertAnnouncement as upsertAnnouncementDoc,
  upsertBanner as upsertBannerDoc,
  upsertCategory as upsertCategoryDoc,
  upsertCoupon as upsertCouponDoc,
  upsertProduct as upsertProductDoc,
  watchAnnouncements,
  watchBanners,
  watchCategories,
  watchCoupons,
  watchProducts,
  watchReviews,
} from '../lib/firestore';
import { isFirebaseConfigured } from '../lib/firebase';
import type { Announcement, Banner, Category, Coupon, NotificationItem, Product, Review } from '../types';

interface DataState {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  coupons: Coupon[];
  reviews: Review[];
  /** Local in-app notifications (welcome message etc.). */
  notifications: NotificationItem[];
  /** Admin-authored announcements broadcast via Firestore. */
  announcements: Announcement[];
  /** Per-announcement read receipts keyed by announcement id. */
  readAnnouncementIds: string[];
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

  setAnnouncements: (a: Announcement[]) => void;
  addAnnouncement: (a: Announcement) => Promise<void>;
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;

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
      // Local notifications start empty — admins broadcast announcements
      // through the Announcements panel instead of a hard-coded welcome
      // toast that everyone is forced to dismiss.
      notifications: [],
      announcements: [],
      readAnnouncementIds: [],
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
          // The product's rating/reviewsCount can only be patched by admins
          // (per Firestore rules). For guest + regular-user reviews this
          // call will permission-deny — that's expected. Swallow it so the
          // review still completes successfully; the next time an admin
          // edits the product the rolled-up counts will be persisted.
          try {
            const updated = get().products.find((p) => p.id === r.productId);
            if (updated) await upsertProductDoc(updated);
          } catch (err) {
            if (typeof console !== 'undefined') {
              console.warn('Could not roll up review counts onto product:', err);
            }
          }
        }
      },

      pushNotification: (n) =>
        set({ notifications: [n, ...get().notifications].slice(0, 30) }),
      markNotificationsRead: () =>
        set({
          notifications: get().notifications.map((n) => ({ ...n, read: true })),
          // Also mark every currently-visible announcement as read.
          readAnnouncementIds: Array.from(
            new Set([
              ...get().readAnnouncementIds,
              ...get().announcements.map((a) => a.id),
            ]),
          ),
        }),

      setAnnouncements: (a) => set({ announcements: a }),
      addAnnouncement: async (a) => {
        set({ announcements: [a, ...get().announcements] });
        if (isFirebaseConfigured) await upsertAnnouncementDoc(a);
      },
      updateAnnouncement: async (id, patch) => {
        set({
          announcements: get().announcements.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        });
        const merged = get().announcements.find((a) => a.id === id);
        if (merged && isFirebaseConfigured) await upsertAnnouncementDoc(merged);
      },
      removeAnnouncement: async (id) => {
        set({ announcements: get().announcements.filter((a) => a.id !== id) });
        if (isFirebaseConfigured) await deleteAnnouncementDoc(id);
      },

      reset: () =>
        set({
          products: seedProducts,
          categories: seedCategories,
          banners: seedBanners,
          coupons: seedCoupons,
          reviews: [],
        }),
    }),
    {
      name: 'ac-data',
      // v3 wipes the legacy `welcome` toast so existing browsers stop
      // seeing the hard-coded "Use code WELCOME10" notification.
      version: 3,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<DataState>;
        if (version < 3) {
          state.notifications = (state.notifications ?? []).filter(
            (n) => n.id !== 'welcome',
          );
        }
        return state as DataState;
      },
    },
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
    watchAnnouncements((items) => useDataStore.getState().setAnnouncements(items)),
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
