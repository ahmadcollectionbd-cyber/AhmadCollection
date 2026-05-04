import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useOrderStore } from '../../stores/orderStore';
import { formatBDT, formatDateTime } from '../../lib/utils';
import type { OrderStatus } from '../../types';
import { OrderTimeline } from '../../components/ui/OrderTimeline';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'on_the_way', 'delivered', 'returned'];

export function AdminOrders() {
  const orders = useOrderStore((s) => s.orders);
  const updateStatus = useOrderStore((s) => s.updateStatus);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <Helmet><title>Orders — Admin</title></Helmet>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading text-2xl font-extrabold">Orders</h1>
          <p className="text-sm text-slate-500">{orders.length} total</p>
        </div>
      </div>

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
                  <td className="px-4 py-3 font-mono text-xs">{o.shortId}</td>
                  <td className="px-4 py-3"><div className="font-medium">{o.customer.name}</div><div className="text-xs text-slate-500">{o.customer.phone}</div></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(o.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => {
                        updateStatus(o.id, e.target.value as OrderStatus);
                        toast.success('Status updated');
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
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">No orders found.</td></tr>
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
            </div>
          );
        })()}
      </div>
    </>
  );
}
