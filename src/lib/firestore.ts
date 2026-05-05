import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Query,
  type QuerySnapshot,
} from 'firebase/firestore';
import type {
  Banner,
  Category,
  Coupon,
  Order,
  OrderStatus,
  Product,
  Review,
} from '../types';
import { db, isFirebaseConfigured } from './firebase';
import { clearFirestoreError, reportFirestoreError } from '../stores/firestoreStatusStore';

type WithId<T> = T & { id: string };

function unwrap<T>(snap: QuerySnapshot): WithId<T>[] {
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

async function seedIfEmpty<T extends { id: string }>(name: string, items: T[]) {
  if (!db) return;
  const ref = collection(db, name);
  const snap = await getDocs(ref);
  if (!snap.empty) return;
  await Promise.all(
    items.map((it) =>
      setDoc(doc(db!, name, it.id), {
        ...it,
        createdAt: (it as { createdAt?: number }).createdAt ?? Date.now(),
        updatedAt: Date.now(),
      }),
    ),
  );
}

/* ─────────────────────────  Products  ───────────────────────── */

export function watchProducts(cb: (items: Product[]) => void) {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      clearFirestoreError('products');
      cb(unwrap<Omit<Product, 'id'>>(snap) as Product[]);
    },
    (error) => reportFirestoreError('products', error),
  );
}

export async function upsertProduct(p: Product): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await setDoc(
    doc(db, 'products', p.id),
    { ...p, updatedAt: Date.now() },
    { merge: true },
  );
}

export async function deleteProduct(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await deleteDoc(doc(db, 'products', id));
}

/* ─────────────────────────  Categories  ───────────────────────── */

export function watchCategories(cb: (items: Category[]) => void) {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(collection(db, 'categories'));
  return onSnapshot(
    q,
    (snap) => {
      clearFirestoreError('categories');
      cb(unwrap<Omit<Category, 'id'>>(snap) as Category[]);
    },
    (error) => reportFirestoreError('categories', error),
  );
}

export async function upsertCategory(c: Category): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await setDoc(doc(db, 'categories', c.id), c, { merge: true });
}

export async function deleteCategory(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await deleteDoc(doc(db, 'categories', id));
}

/* ─────────────────────────  Banners  ───────────────────────── */

export function watchBanners(cb: (items: Banner[]) => void) {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(
    collection(db, 'banners'),
    (snap) => {
      clearFirestoreError('banners');
      cb(unwrap<Omit<Banner, 'id'>>(snap) as Banner[]);
    },
    (error) => reportFirestoreError('banners', error),
  );
}

export async function upsertBanner(b: Banner): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await setDoc(doc(db, 'banners', b.id), b, { merge: true });
}

export async function deleteBanner(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await deleteDoc(doc(db, 'banners', id));
}

/* ─────────────────────────  Coupons  ───────────────────────── */

export function watchCoupons(cb: (items: Coupon[]) => void) {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(
    collection(db, 'coupons'),
    (snap) => {
      clearFirestoreError('coupons');
      cb(unwrap<Omit<Coupon, 'id'>>(snap) as Coupon[]);
    },
    (error) => reportFirestoreError('coupons', error),
  );
}

export async function upsertCoupon(c: Coupon): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await setDoc(doc(db, 'coupons', c.id), c, { merge: true });
}

export async function deleteCoupon(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await deleteDoc(doc(db, 'coupons', id));
}

/* ─────────────────────────  Reviews  ───────────────────────── */

export async function addReviewDoc(r: Review): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await setDoc(doc(db, 'reviews', r.id), r, { merge: true });
}

export function watchReviews(cb: (items: Review[]) => void) {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(
    collection(db, 'reviews'),
    (snap) => {
      clearFirestoreError('reviews');
      cb(unwrap<Omit<Review, 'id'>>(snap) as Review[]);
    },
    (error) => reportFirestoreError('reviews', error),
  );
}

/* ─────────────────────────  Orders  ───────────────────────── */

export async function addOrderDoc(o: Order): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await setDoc(doc(db, 'orders', o.id), o, { merge: true });
}

export async function updateOrderStatusDoc(
  id: string,
  status: OrderStatus,
  history: Order['statusHistory'],
): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  await updateDoc(doc(db, 'orders', id), {
    status,
    statusHistory: history,
    updatedAt: Date.now(),
  });
}

/**
 * Look up a single order by its short ID. Used by the public Track Order page
 * so guests can find their order without signing in. Order short IDs are 8
 * characters from a 31-char alphabet (~8e11 combinations) which makes them
 * effectively unguessable. The doc ID is set to the same value at checkout
 * (see Checkout.tsx) so this is a `get`, not a `list`, and Firestore rules
 * can grant public access by short ID without leaking the full order
 * collection to enumeration.
 *
 * Also falls back to a legacy `where('shortId', '==', ...)` query so orders
 * created before the doc-id-equals-shortId migration remain reachable for
 * authenticated users / admins.
 */
export async function findOrderByShortId(shortId: string): Promise<Order | null> {
  if (!isFirebaseConfigured || !db) return null;
  const trimmed = shortId.trim().toUpperCase();
  if (!trimmed) return null;
  try {
    const direct = await getDoc(doc(db, 'orders', trimmed));
    if (direct.exists()) {
      return { id: direct.id, ...(direct.data() as Omit<Order, 'id'>) };
    }
  } catch {
    /* fall through to legacy lookup */
  }
  try {
    const q = query(collection(db, 'orders'), where('shortId', '==', trimmed));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const first = snap.docs[0];
    return { id: first.id, ...(first.data() as Omit<Order, 'id'>) };
  } catch {
    return null;
  }
}

/**
 * List all orders whose customer phone matches `phone` (digits only). Used to
 * surface guest orders in a logged-in user's history when the userId field
 * was never populated (e.g. they checked out without signing in).
 */
export async function findOrdersByPhone(phone: string): Promise<Order[]> {
  if (!isFirebaseConfigured || !db) return [];
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return [];
  const q = query(
    collection(db, 'orders'),
    where('customer.phone', '==', phone),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
}

export function watchOrdersForUser(uid: string, cb: (items: Order[]) => void) {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      clearFirestoreError('orders');
      cb(unwrap<Omit<Order, 'id'>>(snap) as Order[]);
    },
    (error) => reportFirestoreError('orders', error),
  );
}

export function watchAllOrders(cb: (items: Order[]) => void) {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      clearFirestoreError('orders');
      cb(unwrap<Omit<Order, 'id'>>(snap) as Order[]);
    },
    (error) => reportFirestoreError('orders', error),
  );
}

/* ─────────────────────────  Bootstrap  ───────────────────────── */

export async function seedDefaultData(args: {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  coupons: Coupon[];
}): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await Promise.all([
    seedIfEmpty('products', args.products),
    seedIfEmpty('categories', args.categories),
    seedIfEmpty('banners', args.banners),
    seedIfEmpty('coupons', args.coupons),
  ]);
}

/**
 * Force-overwrite Firestore documents from the in-app seed arrays. Useful when
 * a code-side seed update needs to be pushed to an existing project that was
 * already initialised with older defaults (e.g. fixing wrong product images).
 *
 * Only documents whose IDs match the seed are touched; admin-created items
 * with auto-generated IDs are left intact.
 *
 * Returns counts per collection so the caller can render a summary toast.
 */
export async function resyncCatalogFromCode(args: {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  coupons: Coupon[];
}): Promise<{
  products: number;
  categories: number;
  banners: number;
  coupons: number;
}> {
  if (!isFirebaseConfigured || !db) {
    return { products: 0, categories: 0, banners: 0, coupons: 0 };
  }
  async function overwrite<T extends { id: string }>(name: string, items: T[]) {
    await Promise.all(
      items.map((it) =>
        setDoc(doc(db!, name, it.id), {
          ...it,
          updatedAt: Date.now(),
        }),
      ),
    );
    return items.length;
  }
  const [products, categories, banners, coupons] = await Promise.all([
    overwrite('products', args.products),
    overwrite('categories', args.categories),
    overwrite('banners', args.banners),
    overwrite('coupons', args.coupons),
  ]);
  return { products, categories, banners, coupons };
}

/** Convenience: simple promise-based query helper. */
export async function fetchAll<T>(
  q: Query | string,
): Promise<WithId<T>[]> {
  if (!db) return [];
  const target = typeof q === 'string' ? collection(db, q) : q;
  const snap = await getDocs(target as Query);
  return unwrap<T>(snap);
}

export const __helpers = { addDoc, serverTimestamp };
