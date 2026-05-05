import { useState } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { useFirestoreStatusStore } from '../../stores/firestoreStatusStore';
import { useAuthStore } from '../../stores/authStore';

const DISMISS_KEY = 'ac:firestore-banner-dismissed';

/**
 * Top-of-admin banner that surfaces Firestore subscription / write errors so
 * the admin understands when reads or writes are silently failing
 * (e.g. rules not deployed, missing admin role, offline).
 *
 * Clicking X hides the banner for the rest of the browser session so it
 * doesn't keep reappearing as Firestore subscriptions re-fire errors.
 */
export function FirestoreStatusBanner() {
  const errors = useFirestoreStatusStore((s) => s.errors);
  const clearAll = useFirestoreStatusStore((s) => s.clearAll);
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1',
  );
  const list = Object.values(errors);
  if (list.length === 0 || dismissed) return null;

  const isPermissionDenied = list.some((e) => e.code === 'permission-denied');

  return (
    <div className="card mb-4 border-amber-300/60 bg-amber-50/80 p-4 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
      <div className="flex items-start gap-3">
        <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-amber-900 dark:text-amber-200">
            {isPermissionDenied
              ? 'Firestore is blocking some reads / writes'
              : 'Firestore subscription error'}
          </div>
          {isPermissionDenied && (
            <div className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
              Two things to check:
              <ol className="ml-5 mt-1 list-decimal space-y-0.5">
                <li>
                  Deploy <code className="font-mono">firestore.rules</code> +{' '}
                  <code className="font-mono">storage.rules</code> from the
                  repo (Firebase Console → Firestore → Rules → paste &amp;
                  Publish).
                </li>
                <li>
                  Make sure your account has{' '}
                  <code className="font-mono">role: "admin"</code> on{' '}
                  <code className="font-mono">
                    users/{user?.uid ?? '<your-uid>'}
                  </code>{' '}
                  (Firebase Console → Firestore → users → your uid → add field
                  role = admin).
                </li>
              </ol>
            </div>
          )}
          <ul className="mt-2 space-y-1 text-xs text-amber-900/70 dark:text-amber-100/70">
            {list.map((e) => (
              <li key={e.source}>
                <code className="font-mono">{e.source}</code>
                {e.code ? <> · <code className="font-mono">{e.code}</code></> : null}
                {' — '}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => {
            clearAll();
            sessionStorage.setItem(DISMISS_KEY, '1');
            setDismissed(true);
          }}
          className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-200/50"
          aria-label="Dismiss"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
