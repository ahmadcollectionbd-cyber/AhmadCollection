import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { SiteSettings } from '../types';
import { db, isFirebaseConfigured } from './firebase';
import { clearFirestoreError, reportFirestoreError } from '../stores/firestoreStatusStore';

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
  deliveryInside: 70,
  deliveryOutside: 130,
  deliveryDistricts: [
    { name: 'Dhaka', nameBn: 'ঢাকা', fee: 70 },
    { name: 'Khulna', nameBn: 'খুলনা', fee: 130 },
    { name: 'Chattogram', nameBn: 'চট্টগ্রাম', fee: 130 },
    { name: 'Sylhet', nameBn: 'সিলেট', fee: 150 },
    { name: 'Rajshahi', nameBn: 'রাজশাহী', fee: 130 },
    { name: 'Barishal', nameBn: 'বরিশাল', fee: 150 },
    { name: 'Rangpur', nameBn: 'রংপুর', fee: 150 },
    { name: 'Mymensingh', nameBn: 'ময়মনসিংহ', fee: 130 },
  ],
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
