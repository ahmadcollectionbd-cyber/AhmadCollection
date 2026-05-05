import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useCartStore } from '../stores/cartStore';
import { useDataStore } from '../stores/dataStore';
import { useOrderStore } from '../stores/orderStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { computeShipping } from '../lib/settings';
import { queueOrderNotification } from '../lib/notifications';
import { gaEvent, pixelEvent } from '../lib/pixel';
import { formatBDT, generateOrderId } from '../lib/utils';
import { SafeImage } from '../components/ui/SafeImage';
import type { Order, PaymentMethod, DeliveryZone } from '../types';
import { useTranslation } from 'react-i18next';

const BD_PHONE_REGEX = /^(?:\+?880|0)?1[3-9]\d{8}$/;

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z
    .string()
    .trim()
    .refine((val) => BD_PHONE_REGEX.test(val.replace(/[\s-]/g, '')), {
      message: 'Enter a valid Bangladesh mobile number (e.g. 01712345678)',
    }),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  address: z.string().min(5, 'Address required'),
  city: z.string().optional(),
  area: z.string().optional(),
  note: z.string().optional(),
  paymentRef: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function Checkout() {
  const { t } = useTranslation();
  const { state } = useLocation() as { state?: { couponCode?: string } };
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clear = useCartStore((s) => s.clear);
  const coupons = useDataStore((s) => s.coupons);
  const addOrder = useOrderStore((s) => s.add);
  const pushNotification = useDataStore((s) => s.pushNotification);
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore((s) => s.settings);
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [zone, setZone] = useState<DeliveryZone>('inside');

  const couponCode = state?.couponCode;
  const coupon = couponCode ? coupons.find((c) => c.code === couponCode) : null;
  const discount = coupon
    ? coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value
    : 0;
  const shipping = useMemo(
    () => computeShipping(subtotal, zone, settings),
    [subtotal, zone, settings],
  );
  const total = Math.max(0, subtotal - discount + shipping);

  const cartCount = items.reduce((acc, it) => acc + it.quantity, 0);
  // Fire InitiateCheckout once on first arrival.
  useEffect(() => {
    if (cartCount === 0) return;
    pixelEvent('InitiateCheckout', {
      currency: 'BDT',
      value: total,
      num_items: cartCount,
    });
    gaEvent('begin_checkout', { currency: 'BDT', value: total });
  }, [cartCount, total]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: user?.name || '', phone: '', address: '' },
  });

  if (items.length === 0) {
    return (
      <div className="section mt-12 text-center">
        <h1 className="heading text-2xl font-bold">Your cart is empty</h1>
        <Link to="/shop" className="btn-primary mt-4 inline-flex">Continue Shopping</Link>
      </div>
    );
  }

  async function onSubmit(values: CheckoutForm) {
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !values.paymentRef?.trim()) {
      return toast.error('Please enter the transaction ID');
    }
    const id = `o-${Date.now()}`;
    const shortId = generateOrderId();
    const order: Order = {
      id,
      shortId,
      userId: user?.uid || null,
      guest: !user,
      email: values.email?.trim() || user?.email || undefined,
      customer: {
        name: values.name,
        phone: values.phone,
        address: values.address,
        city: values.city,
        area: values.area,
        note: values.note,
        zone,
      },
      items,
      subtotal,
      shipping,
      discount,
      total,
      couponCode: coupon?.code,
      paymentMethod,
      paymentRef: values.paymentRef,
      status: 'pending',
      statusHistory: [{ status: 'pending', at: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      await addOrder(order);
    } catch (e) {
      console.error('Order persist failed', e);
    }

    pushNotification({
      id: `n-${Date.now()}`,
      title: 'Order placed',
      body: `Order ${shortId} received. We'll confirm it shortly.`,
      read: false,
      createdAt: Date.now(),
      href: `/order/${shortId}`,
    });

    pixelEvent('Purchase', {
      currency: 'BDT',
      value: total,
      contents: items.map((it) => ({ id: it.productId, quantity: it.quantity })),
      content_type: 'product',
      num_items: items.reduce((acc, it) => acc + it.quantity, 0),
    });
    gaEvent('purchase', {
      transaction_id: shortId,
      value: total,
      currency: 'BDT',
      shipping,
      items: items.map((it) => ({
        item_id: it.productId,
        item_name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
    });

    queueOrderNotification({ type: 'order.created', order, settings })
      .then((result) => {
        if (result.smsOk) {
          toast.success('SMS notification sent');
        }
        if (result.emailOk) {
          toast.success('Admin email notification sent');
        }
        if (result.customerEmailOk) {
          toast.success('Order confirmation email sent to you');
        }
        if (result.error) {
          console.warn('Notification errors:', result.error);
        }
      })
      .catch(() => {});

    clear();
    toast.success(t('checkout.success'));
    navigate(`/order/${shortId}`, { replace: true });
  }

  const paymentNumber =
    paymentMethod === 'bkash'
      ? settings.bkashNumber
      : paymentMethod === 'nagad'
        ? settings.nagadNumber
        : '';

  return (
    <>
      <Helmet><title>Checkout — Ahmad Collection</title></Helmet>
      <section className="section mt-8">
        <h1 className="heading text-2xl font-extrabold sm:text-3xl">{t('checkout.title')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">{t('checkout.contact')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">{t('checkout.name')}</label>
                  <input className="input mt-1" placeholder="Your full name" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-accent-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">{t('checkout.phone')}</label>
                  <input className="input mt-1" placeholder="01XXXXXXXXX" {...register('phone')} />
                  {errors.phone && <p className="mt-1 text-xs text-accent-500">{errors.phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Email (optional — for order confirmation)</label>
                  <input className="input mt-1" type="email" placeholder="your@email.com" {...register('email')} />
                  {errors.email && <p className="mt-1 text-xs text-accent-500">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">{t('checkout.shipping')}</h2>
              <div>
                <label className="label">{t('checkout.address')}</label>
                <textarea className="input mt-1 min-h-[70px]" placeholder="House, road, area" {...register('address')} />
                {errors.address && <p className="mt-1 text-xs text-accent-500">{errors.address.message}</p>}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">{t('checkout.city')}</label>
                  <input className="input mt-1" placeholder="Dhaka" {...register('city')} />
                </div>
                <div>
                  <label className="label">{t('checkout.area')}</label>
                  <input className="input mt-1" placeholder="Mirpur" {...register('area')} />
                </div>
              </div>
              <div className="mt-3">
                <label className="label">{t('checkout.note')}</label>
                <input className="input mt-1" placeholder="e.g. Call before delivery" {...register('note')} />
              </div>

              <div className="mt-4">
                <label className="label">Delivery zone</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(['inside', 'outside'] as const).map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZone(z)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        zone === z
                          ? 'border-brand-500 bg-brand-500/5 ring-2 ring-brand-500/20'
                          : 'border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="text-xs uppercase tracking-widest text-slate-400">
                        {z === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}
                      </div>
                      <div className="mt-1 text-sm font-bold">
                        {formatBDT(z === 'inside' ? settings.deliveryInside : settings.deliveryOutside)}
                      </div>
                    </button>
                  ))}
                </div>
                {settings.freeDeliveryAbove > 0 && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Free delivery on orders above {formatBDT(settings.freeDeliveryAbove)}.
                  </p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">{t('checkout.payment')}</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { v: 'bkash', label: t('checkout.bkash'), color: 'from-pink-500 to-pink-600' },
                    { v: 'nagad', label: t('checkout.nagad'), color: 'from-orange-500 to-amber-600' },
                    { v: 'cod', label: t('checkout.cod'), color: 'from-brand-500 to-brand-600' },
                  ] as { v: PaymentMethod; label: string; color: string }[]
                ).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setPaymentMethod(opt.v)}
                    className={`relative rounded-2xl border p-4 text-left transition ${
                      paymentMethod === opt.v
                        ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-500/5'
                        : 'border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-slate-900/60'
                    }`}
                  >
                    <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${opt.color} text-xs font-bold text-white`}>
                      {opt.v === 'cod' ? 'COD' : opt.v[0].toUpperCase()}
                    </div>
                    <div className="mt-2 text-sm font-semibold">{opt.label}</div>
                  </button>
                ))}
              </div>
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/40">
                  <p className="text-slate-600 dark:text-slate-300">
                    Send <b>{formatBDT(total)}</b> to{' '}
                    <b>{paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} {paymentNumber} (Personal)</b>.
                    Then enter the transaction ID below.
                  </p>
                  <input
                    className="input mt-3"
                    placeholder={t('checkout.paymentRef')}
                    {...register('paymentRef')}
                  />
                </div>
              )}
              {paymentMethod === 'cod' && (
                <p className="mt-3 text-xs text-slate-500">
                  Pay in cash when the courier delivers your order. We'll confirm the order on your phone shortly after you submit it.
                </p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full lg:hidden">
              {isSubmitting ? 'Placing order…' : `${t('checkout.placeOrder')} · ${formatBDT(total)}`}
            </button>
          </div>

          <aside className="card sticky top-24 h-fit p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">Order summary</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
              {items.map((it) => (
                <li key={it.productId} className="flex items-center gap-3 text-sm">
                  <SafeImage src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm">{it.name}</div>
                    <div className="text-xs text-slate-500">× {it.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatBDT(it.price * it.quantity)}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatBDT(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{shipping === 0 ? 'Free' : formatBDT(shipping)}</dd></div>
              {discount > 0 && (
                <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="text-accent-600">- {formatBDT(discount)}</dd></div>
              )}
              <div className="border-t border-slate-200/70 my-2 dark:border-white/10" />
              <div className="flex items-baseline justify-between text-base font-bold">
                <dt>Total</dt>
                <dd className="text-brand-700 dark:text-brand-300">{formatBDT(total)}</dd>
              </div>
            </dl>
            <button type="submit" disabled={isSubmitting} className="btn-primary mt-4 hidden w-full lg:flex">
              {isSubmitting ? 'Placing order…' : t('checkout.placeOrder')}
            </button>
          </aside>
        </form>
      </section>
    </>
  );
}
