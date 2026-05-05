import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiCheckCircle, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useOrderStore } from '../stores/orderStore';
import { formatBDT, formatDateTime } from '../lib/utils';
import { OrderTimeline } from '../components/ui/OrderTimeline';
import { OrderActions } from '../components/ui/OrderActions';
import { SafeImage } from '../components/ui/SafeImage';

export function OrderConfirmation() {
  const { shortId = '' } = useParams();
  const order = useOrderStore((s) => s.byShortId(shortId));

  if (!order) {
    return (
      <div className="section py-16 text-center">
        <h1 className="heading text-2xl font-bold">Order not found</h1>
        <Link to="/" className="btn-primary mt-4 inline-flex">Back to home</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Order {order.shortId} — Ahmad Collection</title></Helmet>
      <section className="section mt-8">
        <div className="card overflow-hidden">
          <div className="bg-gradient-brand px-6 py-8 text-white">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="h-7 w-7" />
              <div>
                <h1 className="font-display text-2xl font-extrabold">Thank you for your order!</h1>
                <p className="text-sm text-white/80">We'll contact you on {order.customer.phone} to confirm your order.</p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
              <span className="text-xs uppercase tracking-widest text-white/70">Order ID</span>
              <span className="font-mono text-base font-bold">{order.shortId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(order.shortId);
                  toast.success('Order ID copied');
                }}
                className="rounded-lg p-1.5 hover:bg-white/15"
                aria-label="Copy"
              >
                <FiCopy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">Status</h3>
              <div className="mt-3"><OrderTimeline status={order.status} /></div>
              <OrderActions order={order} />

              <h3 className="mt-6 font-display text-sm font-bold uppercase tracking-wider">Customer</h3>
              <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/40">
                <div className="font-semibold">{order.customer.name}</div>
                <div className="text-slate-500">{order.customer.phone}</div>
                <div className="text-slate-500">{order.customer.address}{order.customer.area ? `, ${order.customer.area}` : ''}{order.customer.city ? `, ${order.customer.city}` : ''}</div>
                {order.customer.note && <div className="mt-1 italic text-slate-500">Note: {order.customer.note}</div>}
                <div className="mt-2 text-xs text-slate-500">Placed {formatDateTime(order.createdAt)}</div>
                <div className="mt-1 text-xs text-slate-500">Payment: <b className="uppercase">{order.paymentMethod}</b>{order.paymentRef ? ` · TXN ${order.paymentRef}` : ''}</div>
              </div>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">Items</h3>
              <ul className="mt-3 space-y-2">
                {order.items.map((it) => (
                  <li key={it.productId} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                    <SafeImage src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-1 text-sm font-medium">{it.name}</div>
                      <div className="text-xs text-slate-500">{formatBDT(it.price)} × {it.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold">{formatBDT(it.price * it.quantity)}</div>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatBDT(order.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{order.shipping === 0 ? 'Free' : formatBDT(order.shipping)}</dd></div>
                {order.discount > 0 && <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="text-accent-600">- {formatBDT(order.discount)}</dd></div>}
                <div className="border-t border-slate-200/70 my-2 dark:border-white/10" />
                <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatBDT(order.total)}</dd></div>
              </dl>
            </div>
          </div>

          <div className="flex gap-2 border-t border-slate-200/70 px-6 py-4 dark:border-white/10">
            <Link to="/track" className="btn-outline text-xs">Track Order</Link>
            <Link to="/shop" className="btn-primary text-xs">Continue Shopping</Link>
          </div>
        </div>
      </section>
    </>
  );
}
