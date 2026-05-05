import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsIsSupported, type Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Default Firebase Web SDK config for the public Ahmad Collection project.
 * In production these values are public (per Firebase docs) and can be
 * overridden via Vite env vars (`VITE_FIREBASE_*`) when self-hosting.
 */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA-Vwd0B2ZIAgkM6iBjgmOZDfcd5wfNunQ',
  authDomain: 'ahmad-collection-c6b0c.firebaseapp.com',
  projectId: 'ahmad-collection-c6b0c',
  storageBucket: 'ahmad-collection-c6b0c.firebasestorage.app',
  messagingSenderId: '542415004794',
  appId: '1:542415004794:web:20570247c05ab1fd86c7c3',
  measurementId: 'G-GRDM227NWP',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? DEFAULT_FIREBASE_CONFIG.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? DEFAULT_FIREBASE_CONFIG.measurementId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  app = getApps()[0] ?? initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    analyticsIsSupported()
      .then((ok) => {
        if (ok && app) {
          analytics = getAnalytics(app);
        }
      })
      .catch(() => {
        /* analytics is optional — silently ignore in unsupported envs */
      });
  }
}

export { app, auth, db, storage, analytics, googleProvider };
