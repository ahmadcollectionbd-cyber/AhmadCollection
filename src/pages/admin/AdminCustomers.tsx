import { Helmet } from 'react-helmet-async';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { FiHeart, FiUser, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useOrderStore } from '../../stores/orderStore';
import { useDataStore } from '../../stores/dataStore';
import { formatBDT, formatDate } from '../../lib/utils';
import { watchAllUsers, type UserDoc } from '../../lib/firestore';
import { isFirebaseConfigured } from '../../lib/firebase';
import { PageHeader } from '../../components/admin/PageHeader';

interface CustomerRow {
  key: string;
  name: string;
  phone: string;
  email?: string | null;
  photoURL?: string | null;
  uid?: string;
  orders: number;
  total: number;
  lastOrder: number;
  address?: string;
  wishlist: string[];
}

export function AdminCustomers() {
  const orders = useOrderStore((s) => s.orders);
  const products = useDataStore((s) => s.products);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  // Stream user docs (admin-only) so we can show profile info + wishlists.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return watchAllUsers((items) => setUsers(items));
  }, []);

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );

  const list = useMemo<CustomerRow[]>(() => {
    const rows: Record<string, CustomerRow> = {};

    // First pass: derive rows from orders (covers guest checkouts).
    for (const o of orders) {
      const key = o.userId ?? `phone:${o.customer.phone}`;
      if (!rows[key]) {
        rows[key] = {
          key,
          name: o.customer.name,
          phone: o.customer.phone,
          email: o.email ?? null,
          uid: o.userId ?? undefined,
          orders: 0,
          total: 0,
          lastOrder: 0,
          address: o.customer.address,
          wishlist: [],
        };
      }
      rows[key].orders += 1;
      rows[key].total += o.total;
      rows[key].lastOrder = Math.max(rows[key].lastOrder, o.createdAt);
    }

    // Second pass: ensure every signed-in user appears even with no orders,
    // and merge in their wishlist + profile info.
    for (const u of users) {
      const key = u.uid;
      if (!rows[key]) {
        rows[key] = {
          key,
          name: u.displayName || u.email || 'Unknown',
          phone: u.phone || '',
          email: u.email,
          photoURL: u.photoURL,
          uid: u.uid,
          orders: 0,
          total: 0,
          lastOrder: 0,
          wishlist: u.wishlist ?? [],
        };
      } else {
        rows[key].uid = u.uid;
        rows[key].photoURL = u.photoURL ?? rows[key].photoURL;
        rows[key].email = u.email ?? rows[key].email;
        rows[key].wishlist = u.wishlist ?? [];
      }
    }

    return Object.values(rows).sort((a, b) => b.lastOrder - a.lastOrder);
  }, [orders, users]);

  return (
    <>
      <Helmet><title>Customers — Admin</title></Helmet>
      <PageHeader
        icon={<FiUsers />}
        title="Customers"
        subtitle={`${list.length} total · click a row to see their wishlist`}
        accent="sky"
      />

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200/70 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Wishlist</th>
                <th className="px-4 py-3">Last order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const isOpen = open === c.key;
                return (
                  <Fragment key={c.key}>
                    <tr className="border-b border-slate-100 last:border-0 dark:border-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.photoURL ? (
                            <img src={c.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                              <FiUser className="h-4 w-4" />
                            </span>
                          )}
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.email || c.address || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{c.phone || '—'}</td>
                      <td className="px-4 py-3"><span className="badge-brand">{c.orders}</span></td>
                      <td className="px-4 py-3 font-semibold">{formatBDT(c.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${c.wishlist.length > 0 ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300' : ''}`}>
                          <FiHeart className="h-3 w-3" />
                          {c.wishlist.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{c.lastOrder ? formatDate(c.lastOrder) : '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? null : c.key)}
                          className="text-xs font-semibold text-brand-600 hover:underline"
                        >
                          {isOpen ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="text-xs uppercase tracking-widest text-slate-500">Wishlist ({c.wishlist.length})</div>
                          {c.wishlist.length === 0 ? (
                            <div className="mt-2 text-sm text-slate-500">No items wishlisted yet.</div>
                          ) : (
                            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {c.wishlist.map((pid) => {
                                const p = productById[pid];
                                if (!p) {
                                  return (
                                    <li key={pid} className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-white/10">
                                      <span className="font-mono">{pid}</span> (unavailable)
                                    </li>
                                  );
                                }
                                return (
                                  <li key={pid} className="flex items-center gap-3 rounded-xl bg-white p-2 dark:bg-slate-900/60">
                                    <img
                                      src={p.images[0]}
                                      alt=""
                                      className="h-12 w-12 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <Link
                                        to={`/product/${p.slug}`}
                                        className="line-clamp-1 text-sm font-medium hover:text-brand-600"
                                      >
                                        {p.name}
                                      </Link>
                                      <div className="text-xs text-slate-500">{formatBDT(p.price)}</div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
