import { create } from 'zustand';

export interface FirestoreError {
  source: string;
  code?: string;
  message: string;
  at: number;
}

interface FirestoreStatusState {
  errors: Record<string, FirestoreError>;
  reportError: (source: string, error: unknown) => void;
  clearError: (source: string) => void;
  clearAll: () => void;
  hasErrors: () => boolean;
  list: () => FirestoreError[];
}

function describeError(error: unknown): { code?: string; message: string } {
  if (typeof error === 'object' && error !== null) {
    const e = error as { code?: string; message?: string };
    return {
      code: typeof e.code === 'string' ? e.code : undefined,
      message: typeof e.message === 'string' ? e.message : String(error),
    };
  }
  return { message: String(error) };
}

export const useFirestoreStatusStore = create<FirestoreStatusState>((set, get) => ({
  errors: {},
  reportError: (source, error) => {
    const { code, message } = describeError(error);
    console.error(`[Firestore:${source}]`, code ?? '', message);
    set((state) => ({
      errors: {
        ...state.errors,
        [source]: { source, code, message, at: Date.now() },
      },
    }));
  },
  clearError: (source) =>
    set((state) => {
      if (!(source in state.errors)) return state;
      const next = { ...state.errors };
      delete next[source];
      return { errors: next };
    }),
  clearAll: () => set({ errors: {} }),
  hasErrors: () => Object.keys(get().errors).length > 0,
  list: () => Object.values(get().errors),
}));

export function reportFirestoreError(source: string, error: unknown) {
  useFirestoreStatusStore.getState().reportError(source, error);
}

export function clearFirestoreError(source: string) {
  useFirestoreStatusStore.getState().clearError(source);
}
