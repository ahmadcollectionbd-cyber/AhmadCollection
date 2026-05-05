import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';
import { useOrderStore } from '../../stores/orderStore';
import { formatBDT, formatDateTime } from '../../lib/utils';
import type { OrderStatus } from '../../types';
import { OrderTimeline } from '../../components/ui/OrderTimeline';
import { useSettingsStore } from '../../stores/settingsStore';
import { queueOrderNotification } from '../../lib/notifications';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'on_the_way', 'delivered', 'returned', 'cancelled'];

/** Statuses considered "finished" — safe to bulk-clear from history. */
const ARCHIVABLE: OrderStatus[] = ['delivered', 'cancelled', 'returned'];

export function AdminOrders() {
  const orders = useOrderStore((s) => s.orders);
  const updateStatus = useOrderStore((s) => s.updateStatus);
  const deleteMany = useOrderStore((s) => s.deleteMany);
  const settings = useSettingsStore((s) => s.settings);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [filter, orders],
  );

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));
  const archivableCount = orders.filter((o) => ARCHIVABLE.includes(o.status)).length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        filtered.forEach((o) => next.delete(o.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((o) => next.add(o.id));
      return next;
    });
  }

  async function changeStatus(id: string, next: OrderStatus) {
    await updateStatus(id, next, `Updated by admin to ${next}`);
    const refreshed = useOrderStore.getState().byId(id);
    if (refreshed) {
      queueOrderNotification({
        type: next === 'cancelled' ? 'order.cancelled' : 'order.updated',
        order: refreshed,
        settings,
      }).catch(() => {});
    }
    toast.success('Status updated');
  }

  async function bulkDelete(ids: string[], label: string) {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} ${label}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const { ok, failed } = await deleteMany(ids);
      if (failed > 0) toast.error(`${failed} could not be deleted (check Firestore rules).`);
      if (ok > 0) toast.success(`Deleted ${ok} ${label}`);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Helmet><title>Orders — Admin</title></Helmet>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="heading text-2xl font-extrabold">Orders</h1>
          <p className="text-sm text-slate-500">{orders.length} total · {selected.size} selected</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              bulkDelete(
                orders.filter((o) => ARCHIVABLE.includes(o.status)).map((o) => o.id),
                'archived orders',
              )
            }
            disabled={busy || archivableCount === 0}
            className="btn-outline text-xs disabled:opacity-50"
            title="Delete every delivered / cancelled / returned order"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            Clear archived ({archivableCount})
          </button>
          <button
            type="button"
            onClick={() => bulkDelete(orders.map((o) => o.id), 'orders')}
            disabled={busy || orders.length === 0}
            className="btn-outline text-xs text-accent-600 disabled:opacity-50"
            title="Permanently delete every order in the system"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            Clear all history
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="card mt-3 flex flex-wrap items-center justify-between gap-3 border-brand-500/40 bg-brand-500/5 p-3 text-sm">
          <span><b>{selected.size}</b> orders selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="btn-outline text-xs"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => bulkDelete(Array.from(selected), 'orders')}
              disabled={busy}
              className="btn-outline text-xs text-accent-600 disabled:opacity-50"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
              Delete selected
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setFilter('all')} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === 'all' ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-slate-900/60'}`}>
          All ({orders.length})
        </button>
        {STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${filter === s ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-slate-900/60'}`}>
              {s.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200/70 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-900/40">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleOne(o.id)}
                      aria-label={`Select ${o.shortId}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{o.shortId}</td>
                  <td className="px-4 py-3"><div className="font-medium">{o.customer.name}</div><div className="text-xs text-slate-500">{o.customer.phone}</div></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(o.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => {
                        changeStatus(o.id, e.target.value as OrderStatus);
                      }}
                      className="input h-8 py-1 text-xs"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3"><button onClick={() => setOpen(open === o.id ? null : o.id)} className="text-xs font-semibold text-brand-600 hover:underline">{open === o.id ? 'Hide' : 'Details'}</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {open && (() => {
          const o = orders.find((x) => x.id === open);
          if (!o) return null;
          return (
            <div className="border-t border-slate-200/70 p-5 dark:border-white/10">
              <OrderTimeline status={o.status} />
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/40">
                  <div className="text-xs uppercase tracking-widest text-slate-500">Customer</div>
                  <div className="mt-1 font-semibold">{o.customer.name}</div>
                  <div className="text-slate-500">{o.customer.phone}</div>
                  <div className="text-slate-500">{o.customer.address}{o.customer.city ? `, ${o.customer.city}` : ''}</div>
                  <div className="mt-2 text-xs text-slate-500">Payment: <b className="uppercase">{o.paymentMethod}</b></div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">Items</div>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {o.items.map((it) => (
                      <li key={it.productId} className="flex items-center gap-2">
                        <img src={it.image} alt="" className="h-8 w-8 rounded-md object-cover" />
                        <span className="line-clamp-1 flex-1">{it.name}</span>
                        <span className="text-xs text-slate-500">× {it.quantity}</span>
                        <span className="font-semibold">{formatBDT(it.price * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => bulkDelete([o.id], 'order')}
                  disabled={busy}
                  className="btn-outline text-xs text-accent-600 disabled:opacity-50"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                  Delete order
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
