import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { useAuthStore, type AuthRole } from '../stores/authStore';

const ADMIN_EMAILS = new Set<string>(['ahmadcollection.bd@gmail.com']);

function roleFor(email: string | null | undefined): AuthRole {
  if (!email) return 'customer';
  return ADMIN_EMAILS.has(email.toLowerCase()) ? 'admin' : 'customer';
}

export function mapFirebaseUser(fbUser: FirebaseUser) {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? '',
    name: fbUser.displayName ?? (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
    role: roleFor(fbUser.email),
    photoURL: fbUser.photoURL ?? undefined,
  };
}

function ensureAuth() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Auth is not configured. Please reload the app.');
  }
  return auth;
}

export async function signUpEmail(name: string, email: string, password: string) {
  const a = ensureAuth();
  const cred = await createUserWithEmailAndPassword(a, email.trim(), password);
  if (cred.user && name) {
    try {
      await updateProfile(cred.user, { displayName: name });
    } catch {
      /* non-fatal */
    }
  }
  return cred.user;
}

export async function signInEmail(email: string, password: string) {
  const a = ensureAuth();
  const cred = await signInWithEmailAndPassword(a, email.trim(), password);
  return cred.user;
}

export async function signInGoogle() {
  const a = ensureAuth();
  const cred = await signInWithPopup(a, googleProvider);
  return cred.user;
}

export async function signOutUser() {
  const a = ensureAuth();
  await signOut(a);
}

export function subscribeAuthState() {
  if (!isFirebaseConfigured || !auth) return () => {};
  const setUser = useAuthStore.getState().setUser;
  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      setUser(mapFirebaseUser(fbUser));
    } else {
      setUser(null);
    }
  });
}

export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by the browser. Please allow popups and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    default:
      return (err as { message?: string })?.message || 'Something went wrong. Please try again.';
  }
}
