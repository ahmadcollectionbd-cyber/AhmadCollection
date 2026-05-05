import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiLogOut, FiPackage, FiSearch, FiTrash2, FiUser, FiX } from 'react-icons/fi';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useOrderStore } from '../stores/orderStore';
import { findOrdersByPhone } from '../lib/firestore';
import { formatBDT, formatDateTime } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { OrderStatusBadge } from '../components/ui/OrderTimeline';
import { OrderActions } from '../components/ui/OrderActions';
import type { Order } from '../types';

const PHONE_KEY = 'ac-account-phone';
const HIDDEN_KEY_PREFIX = 'ac-hidden-orders-';

function loadHidden(uid: string): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY_PREFIX + uid);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveHidden(uid: string, ids: string[]) {
  try {
    localStorage.setItem(HIDDEN_KEY_PREFIX + uid, JSON.stringify(ids));
  } catch {
    /* ignore quota */
  }
}

export function Account() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const orders = useOrderStore((s) => s.orders);
  const navigate = useNavigate();
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) ?? '');
  const [phoneOrders, setPhoneOrders] = useState<Order[]>([]);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneSearched, setPhoneSearched] = useState(false);
  // Load hidden ids for the signed-in user. We compute the initial state
  // synchronously from localStorage so we never have to setState in an
  // effect (which the strict React-Compiler lint forbids).
  const [hiddenByUser, setHiddenByUser] = useState<{ uid: string | null; ids: string[] }>(
    () => ({ uid: user?.uid ?? null, ids: user ? loadHidden(user.uid) : [] }),
  );
  // When the signed-in user changes, re-hydrate the list during render. This
  // is the React-recommended alternative to `useEffect(setState)` for state
  // that derives from props.
  if (hiddenByUser.uid !== (user?.uid ?? null)) {
    setHiddenByUser({
      uid: user?.uid ?? null,
      ids: user ? loadHidden(user.uid) : [],
    });
  }
  const hidden = hiddenByUser.ids;
  const setHidden = (ids: string[]) => setHiddenByUser({ uid: user?.uid ?? null, ids });
  const [showHidden, setShowHidden] = useState(false);

  const allOrders = useMemo(() => {
    if (!user) return [] as Order[];
    const own = orders.filter((o) => o.userId === user.uid);
    if (phoneOrders.length === 0) return own;
    const seen = new Set(own.map((o) => o.id));
    return [...own, ...phoneOrders.filter((o) => !seen.has(o.id))].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }, [orders, phoneOrders, user]);

  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);
  const visibleOrders = useMemo(
    () => (showHidden ? allOrders : allOrders.filter((o) => !hiddenSet.has(o.id))),
    [allOrders, hiddenSet, showHidden],
  );
  const hiddenCount = allOrders.filter((o) => hiddenSet.has(o.id)).length;

  function hideOrder(id: string) {
    if (!user) return;
    const next = Array.from(new Set([...hidden, id]));
    setHidden(next);
    saveHidden(user.uid, next);
    toast.success('Order hidden');
  }

  function unhideOrder(id: string) {
    if (!user) return;
    const next = hidden.filter((x) => x !== id);
    setHidden(next);
    saveHidden(user.uid, next);
  }

  function clearCompleted() {
    if (!user) return;
    const completedIds = allOrders
      .filter((o) => o.status === 'delivered' || o.status === 'cancelled')
      .map((o) => o.id);
    if (completedIds.length === 0) {
      toast('No completed orders to hide');
      return;
    }
    const next = Array.from(new Set([...hidden, ...completedIds]));
    setHidden(next);
    saveHidden(user.uid, next);
    toast.success(`Hid ${completedIds.length} completed orders`);
  }

  function clearAllHistory() {
    if (!user) return;
    if (!confirm('Hide all orders from your history? They will still exist on our side and you can show them again later.')) {
      return;
    }
    const next = allOrders.map((o) => o.id);
    setHidden(next);
    saveHidden(user.uid, next);
    toast.success('Order history cleared from this device');
  }

  async function lookupByPhone(value: string) {
    const trimmed = value.trim();
    setPhoneSearched(true);
    if (!trimmed) {
      setPhoneOrders([]);
      return;
    }
    setPhoneBusy(true);
    try {
      const found = await findOrdersByPhone(trimmed);
      setPhoneOrders(found);
      localStorage.setItem(PHONE_KEY, trimmed);
      if (found.length === 0) {
        toast(`No orders found for ${trimmed}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Phone lookup failed');
    } finally {
      setPhoneBusy(false);
    }
  }

  // Auto-restore the previously saved phone on mount so returning users
  // immediately see their guest order history without re-entering it.
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(PHONE_KEY);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      lookupByPhone(saved);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="section py-16 text-center">
        <h1 className="heading text-2xl font-bold">Please login to view your account</h1>
        <Link to="/login" className="btn-primary mt-4 inline-flex">Login</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>My Account — Ahmad Collection</title></Helmet>
      <section className="section mt-8">
        <div className="card flex items-center gap-4 p-5">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white">
            {user.photoURL ? <img src={user.photoURL} className="h-14 w-14 rounded-full object-cover" alt="" /> : <FiUser className="h-6 w-6" />}
          </div>
          <div>
            <div className="font-display text-lg font-bold">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="ml-auto btn-outline text-xs">
            <FiLogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupByPhone(phone);
          }}
          className="card mt-6 flex flex-wrap items-center gap-2 p-3"
        >
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Find guest orders by phone (e.g. 01712345678)"
              className="input pl-9"
            />
          </div>
          <button type="submit" disabled={phoneBusy} className="btn-outline text-xs">
            {phoneBusy ? 'Searching…' : 'Find'}
          </button>
          {phoneSearched && phone && (
            <button
              type="button"
              onClick={() => {
                setPhone('');
                setPhoneOrders([]);
                setPhoneSearched(false);
                localStorage.removeItem(PHONE_KEY);
              }}
              className="btn-outline text-xs"
            >
              Clear
            </button>
          )}
        </form>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="heading text-xl font-extrabold">My Orders</h2>
            <div className="flex flex-wrap items-center gap-2">
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHidden((v) => !v)}
                  className="btn-outline text-xs"
                >
                  {showHidden ? 'Hide hidden' : `Show hidden (${hiddenCount})`}
                </button>
              )}
              <button
                type="button"
                onClick={clearCompleted}
                className="btn-outline text-xs"
                title="Hide delivered & cancelled orders"
              >
                <FiX className="h-3.5 w-3.5" />
                Clear completed
              </button>
              <button
                type="button"
                onClick={clearAllHistory}
                className="btn-outline text-xs"
                title="Hide every order from this device's history"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                Clear all
              </button>
            </div>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="card mt-3 p-10 text-center text-sm text-slate-500">
              <FiPackage className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3">
                {allOrders.length === 0
                  ? 'No orders yet.'
                  : 'All your orders are hidden. Click "Show hidden" above to bring them back.'}
              </p>
              {allOrders.length === 0 && (
                <p className="mt-1 text-xs">
                  Did you check out as a guest? Add the phone number you used above to find your orders.
                </p>
              )}
              <Link to="/shop" className="btn-primary mt-3 inline-flex">Start shopping</Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {visibleOrders.map((o) => {
                const isHidden = hiddenSet.has(o.id);
                return (
                  <li key={o.id} className={`card p-4 ${isHidden ? 'opacity-70' : ''}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <div className="font-mono text-sm font-bold">{o.shortId}</div>
                        <div className="text-xs text-slate-500">{formatDateTime(o.createdAt)} · {o.items.length} items</div>
                      </div>
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <OrderStatusBadge status={o.status} />
                        <div className="text-sm font-bold">{formatBDT(o.total)}</div>
                        <Link to={`/order/${o.shortId}`} className="btn-outline text-xs">View</Link>
                        {isHidden ? (
                          <button
                            type="button"
                            onClick={() => unhideOrder(o.id)}
                            className="btn-outline text-xs"
                          >
                            Unhide
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => hideOrder(o.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:text-slate-400 dark:hover:bg-rose-500/10"
                            title="Hide this order from history"
                            aria-label="Hide order"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <OrderActions order={o} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
