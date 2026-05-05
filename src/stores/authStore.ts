import { useEffect } from 'react';
import { create } from 'zustand';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import type { UserProfile } from '../types';

export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  role: 'admin' | 'customer';
  photoURL?: string | null;
}

interface AuthState {
  user: AppUser | null;
  authReady: boolean;
  setUser: (u: AppUser | null) => void;
  setAuthReady: (b: boolean) => void;
  loginWithEmail: (email: string, password: string) => Promise<AppUser>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<AppUser>;
  loginWithGoogle: () => Promise<AppUser>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function fetchOrCreateProfile(user: User, displayName?: string): Promise<AppUser> {
  if (!db) {
    return {
      uid: user.uid,
      email: user.email,
      name: displayName || user.displayName || user.email?.split('@')[0] || 'Guest',
      role: 'customer',
      photoURL: user.photoURL,
    };
  }
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || user.email?.split('@')[0] || 'Customer',
      photoURL: user.photoURL,
      role: 'customer',
      createdAt: Date.now(),
    };
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() }, { merge: true });
    return {
      uid: user.uid,
      email: user.email,
      name: profile.displayName!,
      role: 'customer',
      photoURL: user.photoURL,
    };
  }
  const data = snap.data() as UserProfile;
  return {
    uid: user.uid,
    email: user.email,
    name: data.displayName || displayName || user.email?.split('@')[0] || 'Customer',
    role: (data.role as AppUser['role']) || 'customer',
    photoURL: data.photoURL ?? user.photoURL,
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  authReady: false,
  setUser: (u) => set({ user: u }),
  setAuthReady: (b) => set({ authReady: b }),

  loginWithEmail: async (email, password) => {
    if (!auth) throw new Error('Auth is not configured');
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const profile = await fetchOrCreateProfile(cred.user);
    set({ user: profile });
    return profile;
  },

  registerWithEmail: async (name, email, password) => {
    if (!auth) throw new Error('Auth is not configured');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name && cred.user) {
      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {
        /* non-fatal */
      }
    }
    const profile = await fetchOrCreateProfile(cred.user, name);
    set({ user: profile });
    return profile;
  },

  loginWithGoogle: async () => {
    if (!auth) throw new Error('Auth is not configured');
    const provider = googleProvider ?? new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const profile = await fetchOrCreateProfile(cred.user);
    set({ user: profile });
    return profile;
  },

  resetPassword: async (email) => {
    if (!auth) throw new Error('Auth is not configured');
    await sendPasswordResetEmail(auth, email.trim());
  },

  logout: async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        /* non-fatal */
      }
    }
    set({ user: null });
  },
}));

let started = false;

/** Bootstrap auth state listener — call once near the app root. */
export function startAuthListener() {
  if (started) return;
  started = true;
  if (!isFirebaseConfigured || !auth) {
    useAuthStore.getState().setAuthReady(true);
    return;
  }
  onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const profile = await fetchOrCreateProfile(fbUser);
        useAuthStore.setState({ user: profile, authReady: true });
      } catch {
        useAuthStore.setState({
          user: {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Customer',
            role: 'customer',
            photoURL: fbUser.photoURL,
          },
          authReady: true,
        });
      }
    } else {
      useAuthStore.setState({ user: null, authReady: true });
    }
  });
}

export function useAuthBoot() {
  useEffect(() => {
    startAuthListener();
  }, []);
}
