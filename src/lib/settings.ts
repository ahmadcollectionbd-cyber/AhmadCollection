import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { DeliveryMode, MangoDeliveryConfig, MangoZone, SiteSettings } from '../types';
import { db, isFirebaseConfigured } from './firebase';
import { clearFirestoreError, reportFirestoreError } from '../stores/firestoreStatusStore';

/**
 * Steadfast Courier mango-delivery defaults pre-populated from the
 * shop's reference rate sheet. Disabled by default — the admin needs to
 * flip `enabled` on after reviewing the numbers.
 */
export const DEFAULT_MANGO_DELIVERY: MangoDeliveryConfig = {
  enabled: false,
  weightThresholdKg: 20,
  zones: {
    cityInside: {
      belowThreshold: { pointPerKg: 13, homePerKg: 22 },
      aboveThreshold: { pointPerKg: 12, homePerKg: 20 },
    },
    districtOutside: {
      belowThreshold: { pointPerKg: 16, homePerKg: 24 },
      aboveThreshold: { pointPerKg: 16, homePerKg: 22 },
    },
    upozila: {
      belowThreshold: { pointPerKg: 18, homePerKg: 26 },
      aboveThreshold: { pointPerKg: 16, homePerKg: 24 },
    },
  },
  minimumCharge: {
    cityInside: { point: 100, home: 120 },
    districtOutside: { point: 120, home: 130 },
    upozila: { point: 120, home: 130 },
  },
};

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: 'Ahmad Collection',
  brandTagline: 'Trusted quality at honest prices',
  brandTaglineBn: 'সুলভ মূল্যে, বিশ্বস্ততার সঙ্গে',
  contactPhone: '+8801914138238',
  contactPhoneDisplay: '+880 1914-138238',
  whatsappNumber: '8801914138238',
  facebookUrl: 'https://web.facebook.com/profile.php?id=100069312635469',
  messengerUrl: 'https://m.me/100069312635469',
  instagramUrl: '',
  supportEmail: 'ahmadcollection.bd@gmail.com',
  bkashNumber: '01914138238',
  nagadNumber: '01914138238',
  paymentMethodsEnabled: {
    bkash: true,
    nagad: true,
    bank: false,
    cod: true,
  },
  bankAccount: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    routingNumber: '',
  },
  deliveryCityName: 'Dhaka',
  deliveryInside: 70,
  deliveryOutside: 130,
  deliveryDistricts: [],
  mangoDelivery: DEFAULT_MANGO_DELIVERY,
  freeDeliveryAbove: 1500,
  adminSmsPhone: '01914138238',
  adminEmail: 'ahmadcollection.bd@gmail.com',
  smsWebhookUrl: '',
  emailWebhookUrl: '',
  emailJsServiceId: '',
  emailJsTemplateId: '',
  emailJsPublicKey: '',
  serverlessEmailUrl: '/api/send-email',
  serverlessEmailToken: '',
  smsApiUrl: '',
  smsApiToken: '',
  smsApiSenderId: '',
  imgbbApiKey: '',
  metaPixelId: '',
  gaMeasurementId: '',
  seoDescription:
    'Premium natural products in Bangladesh. Pure mustard oil, raw honey, ghee, dates, spices and more — delivered nationwide.',
  seoDescriptionBn:
    'বাংলাদেশে প্রিমিয়াম প্রাকৃতিক পণ্য। খাঁটি সরিষার তেল, কাঁচা মধু, ঘি, খেজুর, মসলা — সারাদেশে ডেলিভারি।',
  seoKeywords:
    'ahmad collection, mustard oil, honey, ghee, attar, dates, bangladesh, organic, খাঁটি মধু, সরিষার তেল',
  ogImage: '/banner.png',
};

const SETTINGS_PATH = ['settings', 'site'] as const;

export function settingsRef() {
  if (!db) return null;
  return doc(db, SETTINGS_PATH[0], SETTINGS_PATH[1]);
}

export function subscribeToSettings(cb: (s: SiteSettings) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  const ref = settingsRef();
  if (!ref) return () => {};
  return onSnapshot(
    ref,
    (snap) => {
      clearFirestoreError('settings');
      if (snap.exists()) {
        cb({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<SiteSettings>) });
      } else {
        cb(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      reportFirestoreError('settings', error);
      cb(DEFAULT_SETTINGS);
    },
  );
}

export async function saveSettings(patch: Partial<SiteSettings>): Promise<void> {
  const ref = settingsRef();
  if (!ref) throw new Error('Firebase is not configured');
  await setDoc(ref, patch, { merge: true });
}

/**
 * Compute shipping cost for an order.
 *
 * Priority:
 *  1. Per-district override (`settings.deliveryDistricts`) matched on `city`.
 *  2. Inside / outside Dhaka fallback based on the chosen `zone`.
 *  3. Free delivery if subtotal crosses the threshold.
 */
export function computeShipping(
  subtotal: number,
  zone: 'inside' | 'outside' | undefined,
  settings: SiteSettings,
  city?: string,
): number {
  if (subtotal <= 0) return 0;
  if (settings.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove) return 0;

  if (city && settings.deliveryDistricts && settings.deliveryDistricts.length) {
    const lower = city.trim().toLowerCase();
    const match = settings.deliveryDistricts.find(
      (d) => d.name.toLowerCase() === lower || d.nameBn === city.trim(),
    );
    if (match) return match.fee;
  }

  return zone === 'outside' ? settings.deliveryOutside : settings.deliveryInside;
}

/** Convenience: look up a district by name (case-insensitive). */
export function findDistrict(
  settings: SiteSettings,
  city?: string,
) {
  if (!city || !settings.deliveryDistricts) return undefined;
  const lower = city.trim().toLowerCase();
  return settings.deliveryDistricts.find(
    (d) => d.name.toLowerCase() === lower || d.nameBn === city.trim(),
  );
}

/**
 * Steadfast-style per-kg shipping for a mango (per-kg `food`) line.
 * Returns the higher of (per-kg total) and (zone+mode minimum charge).
 *
 * NOTE: Not yet wired into `Cart.tsx` / `Checkout.tsx`. Phase D will
 * call this to compute mango shipping; exporting it now so the helper
 * is available alongside `computeShipping` and unit-testable.
 */
export function computeMangoShipping(
  weightKg: number,
  zone: MangoZone,
  mode: DeliveryMode,
  config: MangoDeliveryConfig,
): number {
  if (!config.enabled || weightKg <= 0) return 0;
  const tier =
    weightKg >= config.weightThresholdKg
      ? config.zones[zone].aboveThreshold
      : config.zones[zone].belowThreshold;
  const ratePerKg = mode === 'home' ? tier.homePerKg : tier.pointPerKg;
  const perKgTotal = Math.round(ratePerKg * weightKg);
  const minimum = config.minimumCharge[zone][mode] ?? 0;
  return Math.max(perKgTotal, minimum);
}

/**
 * Resolve the advance-delivery charge for a product. Product-level value
 * takes priority over the category default; returning `0` (set
 * explicitly on the product) overrides an inherited category amount.
 *
 * Looks up the *first* category in `categoryIds` that defines an
 * `advanceDeliveryCharge` and uses it. Returns `0` when nothing matches.
 */
export function resolveAdvanceCharge(
  product: { advanceDeliveryCharge?: number; categoryIds: string[] },
  categories: { id: string; advanceDeliveryCharge?: number }[],
): number {
  if (typeof product.advanceDeliveryCharge === 'number') {
    return Math.max(0, product.advanceDeliveryCharge);
  }
  for (const cid of product.categoryIds ?? []) {
    const cat = categories.find((c) => c.id === cid);
    if (cat && typeof cat.advanceDeliveryCharge === 'number' && cat.advanceDeliveryCharge > 0) {
      return cat.advanceDeliveryCharge;
    }
  }
  return 0;
}
