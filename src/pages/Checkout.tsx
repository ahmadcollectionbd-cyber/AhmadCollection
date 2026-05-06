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
import {
  computeShipping,
  findDistrict,
  computeMangoShipping,
  resolveAdvanceCharge,
  DEFAULT_MANGO_DELIVERY,
} from '../lib/settings';
import { queueOrderNotification } from '../lib/notifications';
import { gaEvent, pixelEvent } from '../lib/pixel';
import { formatBDT, generateOrderId } from '../lib/utils';
import { SafeImage } from '../components/ui/SafeImage';
import type { Order, PaymentMethod, DeliveryZone, MangoZone, DeliveryMode } from '../types';
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
  const products = useDataStore((s) => s.products);
  const categories = useDataStore((s) => s.categories);
  const addOrder = useOrderStore((s) => s.add);
  const pushNotification = useDataStore((s) => s.pushNotification);
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore((s) => s.settings);
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [zone, setZone] = useState<DeliveryZone>('inside');
  const [mangoZone, setMangoZone] = useState<MangoZone>('cityInside');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('point');

  const couponCode = state?.couponCode;
  const coupon = couponCode ? coupons.find((c) => c.code === couponCode) : null;
  const discount = coupon
    ? coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value
    : 0;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: user?.name || '', phone: '', address: '' },
  });

  // Detect per-kg food (mango) lines and sum total kg. When the cart has any,
  // the customer picks Steadfast point/home + 3-zone instead of the standard
  // inside/outside split.
  const mangoKg = items.reduce((acc, it) => {
    if (it.productType === 'food' && typeof it.weightKg === 'number') {
      return acc + it.weightKg;
    }
    return acc;
  }, 0);
  const mangoSubtotal = items.reduce((acc, it) => {
    if (it.productType === 'food' && typeof it.weightKg === 'number') {
      return acc + it.price * it.quantity + (it.cratePrice ?? 0);
    }
    return acc;
  }, 0);
  const standardSubtotal = subtotal - mangoSubtotal;
  const hasMango = mangoKg > 0 && (settings.mangoDelivery?.enabled ?? false);

  // We `watch` the city so the visible shipping fee updates the moment the
  // customer types a known district (e.g. "Khulna").
  const watchedCity = watch('city');
  const standardShipping = useMemo(
    () =>
      standardSubtotal > 0
        ? computeShipping(standardSubtotal, zone, settings, watchedCity)
        : 0,
    [standardSubtotal, zone, settings, watchedCity],
  );
  const mangoShipping = useMemo(() => {
    if (!hasMango) return 0;
    return computeMangoShipping(
      mangoKg,
      mangoZone,
      deliveryMode,
      settings.mangoDelivery ?? DEFAULT_MANGO_DELIVERY,
    );
  }, [hasMango, mangoKg, mangoZone, deliveryMode, settings.mangoDelivery]);
  const shipping = standardShipping + mangoShipping;
  const districtMatch = findDistrict(settings, watchedCity);

  // Sum advance-delivery charges per cart line by looking up the live product
  // (so updates to the override are picked up). Per-kg lines pay one charge,
  // unit lines multiply by quantity to mirror the customer's expectation that
  // "ekta product e advance" applies to each piece booked.
  const advanceCharge = useMemo(() => {
    let total = 0;
    for (const it of items) {
      const p = products.find((x) => x.id === it.productId);
      if (!p) continue;
      const charge = resolveAdvanceCharge(p, categories);
      if (charge <= 0) continue;
      const isPerKg = it.productType === 'food' && typeof it.weightKg === 'number';
      total += isPerKg ? charge : charge * it.quantity;
    }
    return total;
  }, [items, products, categories]);

  const total = Math.max(0, subtotal - discount + shipping);
  const codDue = Math.max(0, total - advanceCharge);
  const advanceRequired = advanceCharge > 0;

  // When an advance is required, force payment method to bKash/Nagad so the
  // customer can submit the upfront charge alongside their tx ID.
  useEffect(() => {
    if (advanceRequired && paymentMethod === 'cod') {
      setPaymentMethod('bkash');
    }
  }, [advanceRequired, paymentMethod]);

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

  if (items.length === 0) {
    return (
      <div className="section mt-12 text-center">
        <h1 className="heading text-2xl font-bold">Your cart is empty</h1>
        <Link to="/shop" className="btn-primary mt-4 inline-flex">Continue Shopping</Link>
      </div>
    );
  }

  async function onSubmit(values: CheckoutForm) {
    if (advanceRequired && paymentMethod === 'cod') {
      return toast.error('This order requires an advance payment via bKash or Nagad');
    }
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !values.paymentRef?.trim()) {
      return toast.error('Please enter the transaction ID');
    }
    const crateTotal = items.reduce((acc, it) => acc + (it.cratePrice ?? 0), 0);
    // The Firestore document ID is intentionally the same as the unguessable
    // short ID. That lets us expose Track Order to guests via a single
    // `getDoc(doc('orders', shortId))` (a `get`, not a `list`) so the rule
    // can be `allow get: if true` without exposing arbitrary docs.
    const shortId = generateOrderId();
    const id = shortId;
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
        ...(hasMango ? { mangoZone, deliveryMode } : {}),
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
      ...(crateTotal > 0 ? { crateTotal } : {}),
      ...(advanceRequired
        ? {
            advancePaid: advanceCharge,
            advanceMethod: paymentMethod === 'nagad' ? 'nagad' : 'bkash',
            advanceRef: values.paymentRef,
          }
        : {}),
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
                  <input
                    className="input mt-1"
                    list="checkout-districts"
                    placeholder={settings.deliveryCityName || 'Dhaka'}
                    {...register('city')}
                  />
                  <datalist id="checkout-districts">
                    {(settings.deliveryDistricts ?? []).map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.nameBn ? `${d.nameBn} — ${formatBDT(d.fee)}` : `${formatBDT(d.fee)}`}
                      </option>
                    ))}
                  </datalist>
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

              {standardSubtotal > 0 && (
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
                          {z === 'inside'
                            ? `Inside ${settings.deliveryCityName || 'Dhaka'}`
                            : `Outside ${settings.deliveryCityName || 'Dhaka'}`}
                        </div>
                        <div className="mt-1 text-sm font-bold">
                          {formatBDT(z === 'inside' ? settings.deliveryInside : settings.deliveryOutside)}
                        </div>
                      </button>
                    ))}
                  </div>
                  {districtMatch && (
                    <div className="mt-2 rounded-xl border border-brand-500/30 bg-brand-500/5 px-3 py-2 text-xs text-brand-700 dark:text-brand-300">
                      <b>{districtMatch.name}</b>
                      {districtMatch.nameBn ? ` — ${districtMatch.nameBn}` : ''}: delivery <b>{formatBDT(districtMatch.fee)}</b>.
                    </div>
                  )}
                  {settings.freeDeliveryAbove > 0 && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Free delivery on orders above {formatBDT(settings.freeDeliveryAbove)}.
                    </p>
                  )}
                </div>
              )}

              {hasMango && (
                <div className="mt-4 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <div className="flex items-baseline justify-between">
                    <label className="label">Mango / per-kg delivery</label>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {mangoKg} kg
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Steadfast Courier — choose your zone and pickup mode.
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'point' as const, label: 'Point delivery', help: 'Pick up from a Steadfast hub' },
                        { id: 'home' as const, label: 'Home delivery', help: 'Doorstep delivery' },
                      ]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDeliveryMode(m.id)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          deliveryMode === m.id
                            ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                            : 'border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="text-sm font-bold">{m.label}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{m.help}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        { id: 'cityInside' as const, label: 'Dhaka City' },
                        { id: 'districtOutside' as const, label: 'Outside District' },
                        { id: 'upozila' as const, label: 'Upozila' },
                      ]
                    ).map((z) => {
                      const cfg = settings.mangoDelivery ?? DEFAULT_MANGO_DELIVERY;
                      const preview = computeMangoShipping(mangoKg, z.id, deliveryMode, cfg);
                      return (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => setMangoZone(z.id)}
                          className={`rounded-2xl border p-3 text-left transition ${
                            mangoZone === z.id
                              ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                              : 'border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-slate-900/60'
                          }`}
                        >
                          <div className="text-xs uppercase tracking-widest text-slate-400">
                            {z.label}
                          </div>
                          <div className="mt-1 text-sm font-bold">{formatBDT(preview)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">{t('checkout.payment')}</h2>
              {advanceRequired && (
                <div className="mb-3 rounded-2xl border border-amber-300/60 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <div className="font-semibold">Advance delivery charge required</div>
                  <p className="mt-0.5">
                    Pay <span className="font-bold">{formatBDT(advanceCharge)}</span>{' '}
                    upfront via bKash or Nagad to confirm this order. The
                    remaining <span className="font-bold">{formatBDT(codDue)}</span>{' '}
                    is collected on delivery.
                  </p>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { v: 'bkash', label: t('checkout.bkash'), color: 'from-pink-500 to-pink-600' },
                    { v: 'nagad', label: t('checkout.nagad'), color: 'from-orange-500 to-amber-600' },
                    { v: 'cod', label: t('checkout.cod'), color: 'from-brand-500 to-brand-600' },
                  ] as { v: PaymentMethod; label: string; color: string }[]
                ).map((opt) => {
                  const disabled = advanceRequired && opt.v === 'cod';
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && setPaymentMethod(opt.v)}
                      className={`relative rounded-2xl border p-4 text-left transition ${
                        paymentMethod === opt.v
                          ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-500/5'
                          : 'border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-slate-900/60'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${opt.color} text-xs font-bold text-white`}>
                        {opt.v === 'cod' ? 'COD' : opt.v[0].toUpperCase()}
                      </div>
                      <div className="mt-2 text-sm font-semibold">{opt.label}</div>
                      {disabled && (
                        <div className="mt-1 text-[10px] text-slate-500">
                          Not available — advance required
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                <div className="mt-4 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-white to-brand-50 p-4 text-sm shadow-sm dark:border-brand-500/40 dark:from-slate-900/60 dark:to-brand-500/10">
                  <p className="text-slate-700 dark:text-slate-200">
                    Send{' '}
                    <span className="font-bold">
                      {formatBDT(advanceRequired ? advanceCharge : total)}
                    </span>{' '}
                    to:
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-bold text-white ${
                        paymentMethod === 'bkash'
                          ? 'bg-gradient-to-br from-pink-500 to-pink-600'
                          : 'bg-gradient-to-br from-orange-500 to-amber-600'
                      }`}
                    >
                      {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} (Personal)
                    </span>
                    <span className="font-mono text-base font-bold tracking-wide">
                      {paymentNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(paymentNumber).then(
                            () => toast.success('Number copied'),
                            () => toast.error('Could not copy'),
                          );
                        }
                      }}
                      className="btn-outline px-2 py-1 text-[11px]"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {advanceRequired
                      ? `After sending the advance ${formatBDT(advanceCharge)}, paste the transaction ID below. The remaining ${formatBDT(codDue)} is collected on delivery.`
                      : 'After sending, paste the transaction ID below so we can match the payment to your order.'}
                  </p>
                  <input
                    className="input mt-2"
                    placeholder={t('checkout.paymentRef')}
                    {...register('paymentRef')}
                  />
                </div>
              )}
              {paymentMethod === 'cod' && !advanceRequired && (
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
              {items.map((it) => {
                const isPerKg = it.productType === 'food' && typeof it.weightKg === 'number';
                const lineTotal = it.price * it.quantity + (it.cratePrice ?? 0);
                return (
                <li key={`${it.productId}|${it.variantId ?? ''}`} className="flex items-center gap-3 text-sm">
                  <SafeImage src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm">
                      {it.name}
                      {it.variantLabel && (
                        <span className="ml-1 text-xs text-slate-500">· {it.variantLabel}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isPerKg ? `${it.quantity} kg @ ${formatBDT(it.price)}/kg` : `× ${it.quantity}`}
                      {it.crateLabel && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">+ {it.crateLabel} {formatBDT(it.cratePrice ?? 0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatBDT(lineTotal)}</div>
                </li>
                );
              })}
            </ul>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatBDT(subtotal)}</dd></div>
              {standardSubtotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Shipping{hasMango ? ' (standard)' : ''}
                  </dt>
                  <dd>{standardShipping === 0 ? 'Free' : formatBDT(standardShipping)}</dd>
                </div>
              )}
              {hasMango && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Mango delivery ({deliveryMode === 'home' ? 'Home' : 'Point'})
                  </dt>
                  <dd>{formatBDT(mangoShipping)}</dd>
                </div>
              )}
              {!standardSubtotal && !hasMango && (
                <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>Free</dd></div>
              )}
              {discount > 0 && (
                <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="text-accent-600">- {formatBDT(discount)}</dd></div>
              )}
              <div className="border-t border-slate-200/70 my-2 dark:border-white/10" />
              <div className="flex items-baseline justify-between text-base font-bold">
                <dt>Total</dt>
                <dd className="text-brand-700 dark:text-brand-300">{formatBDT(total)}</dd>
              </div>
              {advanceRequired && (
                <div className="mt-2 rounded-xl border border-amber-300/60 bg-amber-50/60 p-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <div className="flex justify-between">
                    <span>Advance (pay now)</span>
                    <span className="font-bold">{formatBDT(advanceCharge)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>Cash on delivery</span>
                    <span className="font-bold">{formatBDT(codDue)}</span>
                  </div>
                </div>
              )}
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
