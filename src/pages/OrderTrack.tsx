import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiSearch } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '../stores/orderStore';
import { findOrderByShortId } from '../lib/firestore';
import { formatBDT, formatDateTime } from '../lib/utils';
import { OrderTimeline } from '../components/ui/OrderTimeline';
import { OrderActions } from '../components/ui/OrderActions';
import { SafeImage } from '../components/ui/SafeImage';
import type { Order } from '../types';

export function OrderTrack() {
  const { t } = useTranslation();
  const [id, setId] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteOrder, setRemoteOrder] = useState<Order | null>(null);
  const localOrder = useOrderStore((s) => s.byShortId(id));
  const order = localOrder ?? remoteOrder;

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
    setRemoteOrder(null);
    if (!id.trim()) return;
    // Local-store hit covers the just-placed-on-this-device case instantly.
    // Otherwise fall back to a public Firestore lookup so guests / different
    // devices can still track.
    if (useOrderStore.getState().byShortId(id)) return;
    setLoading(true);
    try {
      const found = await findOrderByShortId(id);
      setRemoteOrder(found);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet><title>Track Order — Ahmad Collection</title></Helmet>
      <section className="section mt-8">
        <h1 className="heading text-2xl font-extrabold sm:text-3xl">{t('order.track')}</h1>
        <p className="text-sm text-slate-500">Enter the Order ID we sent you to see live status.</p>

        <form
          onSubmit={onSearch}
          className="card mt-6 flex gap-2 p-3"
        >
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={id}
              onChange={(e) => setId(e.target.value.toUpperCase())}
              placeholder={t('order.enterId')}
              className="input pl-9 font-mono uppercase tracking-wider"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary text-xs">
            {loading ? 'Searching…' : 'Track'}
          </button>
        </form>

        {searched && (
          <div className="mt-6">
            {loading ? (
              <div className="card p-10 text-center text-sm text-slate-500">Searching…</div>
            ) : !order ? (
              <div className="card p-10 text-center text-sm text-slate-500">{t('order.notFound')}</div>
            ) : (
              <div className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500">Order</div>
                    <div className="font-mono text-lg font-bold">{order.shortId}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>Placed {formatDateTime(order.createdAt)}</div>
                    <div>Total <b>{formatBDT(order.total)}</b></div>
                  </div>
                </div>
                <div className="mt-6"><OrderTimeline status={order.status} /></div>
                <OrderActions order={order} />
                <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
                    <div className="font-semibold">{order.customer.name}</div>
                    <div className="text-slate-500">{order.customer.phone}</div>
                    <div className="text-slate-500">{order.customer.address}</div>
                  </div>
                  <ul className="space-y-2">
                    {order.items.slice(0, 3).map((it) => (
                      <li key={it.productId} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/40">
                        <SafeImage src={it.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{it.name}</div>
                          <div className="text-xs text-slate-500">× {it.quantity}</div>
                        </div>
                      </li>
                    ))}
                    {order.items.length > 3 && <li className="text-xs text-slate-500">+ {order.items.length - 3} more items</li>}
                  </ul>
                </div>
                {order.statusHistory.length > 1 && (
                  <div className="mt-6">
                    <div className="text-xs uppercase tracking-widest text-slate-500">Activity</div>
                    <ul className="mt-2 space-y-1 text-xs">
                      {order.statusHistory.map((h, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                          <span className="font-semibold capitalize">{t(`order.status.${h.status}`)}</span>
                          <span className="text-slate-500">· {formatDateTime(h.at)}</span>
                          {h.note && <span className="text-slate-500">— {h.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
