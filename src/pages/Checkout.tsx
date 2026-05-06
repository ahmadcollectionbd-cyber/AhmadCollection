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
import { PaymentBrand } from '../components/payments/PaymentBrand';
import type { CartItem, Order, PaymentMethod, DeliveryZone, MangoZone, DeliveryMode } from '../types';
import { useTranslation } from 'react-i18next';
import { BD_GEO } from '../data/bdGeo';

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
  division: z.string().optional(),
  district: z.string().optional(),
  thana: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  note: z.string().optional(),
  paymentRef: z.string().optional(),
  couponCode: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function Checkout() {
  const { t } = useTranslation();
  const { state } = useLocation() as { state?: { couponCode?: string; buyNowItem?: CartItem } };
  const cartItems = useCartStore((s) => s.items);
  // If "Buy Now" was used, only checkout that single item; otherwise use full cart.
  const isBuyNow = !!state?.buyNowItem;
  const items = isBuyNow ? [state.buyNowItem!] : cartItems;
  const subtotal = isBuyNow
    ? items.reduce((acc, it) => acc + it.price * it.quantity + (it.cratePrice ?? 0), 0)
    : useCartStore.getState().subtotal();
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
  const [couponInput, setCouponInput] = useState(state?.couponCode ?? '');
  const [appliedCoupon, setAppliedCoupon] = useState(state?.couponCode ?? '');
  const [orderImages, setOrderImages] = useState<string[]>([]);
  const [uploadingOrderImg, setUploadingOrderImg] = useState(false);

  const coupon = appliedCoupon ? coupons.find((c) => c.code === appliedCoupon && c.active) : null;
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

  const watchedDivision = watch('division');
  const watchedDistrict = watch('district');
  const watchedThana = watch('thana');

  // Derive available districts/thanas from the selected division/district
  const selectedDivision = BD_GEO.find((d) => d.name === watchedDivision);
  const availableDistricts = selectedDivision?.districts ?? [];
  const selectedDistrictObj = availableDistricts.find((d) => d.name === watchedDistrict);
  const availableThanas = selectedDistrictObj?.thanas ?? [];

  // Auto-detect delivery zone based on selected district
  useEffect(() => {
    if (!watchedDistrict) return;
    const baseCityName = (settings.deliveryCityName || 'Dhaka').trim().toLowerCase();
    const districtLower = watchedDistrict.trim().toLowerCase();
    // If the district matches the base city, it's "inside", otherwise "outside"
    if (districtLower === baseCityName) {
      setZone('inside');
    } else {
      setZone('outside');
    }
    // Auto-detect mango zone based on whether it's in the city, a district, or upazila
    if (districtLower === baseCityName) {
      setMangoZone('cityInside');
    } else if (watchedThana && !watchedThana.toLowerCase().includes('sadar')) {
      setMangoZone('upozila');
    } else {
      setMangoZone('districtOutside');
    }
  }, [watchedDistrict, watchedThana, settings.deliveryCityName]);

  // We `watch` the city so the visible shipping fee updates the moment the
  // customer types a known district (e.g. "Khulna").
  const watchedCity = watchedDistrict || watch('city');
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

  // Per-method on/off toggles configured in Admin → Settings → Payments.
  const enabled = useMemo(
    () =>
      settings.paymentMethodsEnabled ?? {
        bkash: true,
        nagad: true,
        bank: false,
        cod: true,
      },
    [settings.paymentMethodsEnabled],
  );
  const enabledMethods = useMemo<PaymentMethod[]>(
    () =>
      (['bkash', 'nagad', 'bank', 'cod'] as PaymentMethod[]).filter(
        (m) => enabled[m],
      ),
    [enabled],
  );

  // When an advance is required, force payment method to a non-COD channel
  // (bKash / Nagad / Bank, whichever is enabled) so the customer can submit
  // the upfront charge alongside their tx ID. Also keep the selected method
  // in sync if the admin disables it after the customer arrived.
  useEffect(() => {
    if (advanceRequired && paymentMethod === 'cod') {
      const fallback = enabledMethods.find((m) => m !== 'cod') ?? 'bkash';
      setPaymentMethod(fallback);
      return;
    }
    if (!enabled[paymentMethod] && enabledMethods.length > 0) {
      setPaymentMethod(enabledMethods[0]);
    }
  }, [advanceRequired, paymentMethod, enabled, enabledMethods]);

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
      return toast.error('This order requires an advance payment via bKash, Nagad or Bank');
    }
    if (
      (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'bank') &&
      !values.paymentRef?.trim()
    ) {
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
        city: values.district || values.city,
        area: values.area,
        division: values.division,
        district: values.district,
        thana: values.thana,
        note: values.note,
        zone,
        ...(hasMango ? { mangoZone, deliveryMode } : {}),
      },
      items,
      subtotal,
      shipping,
      discount,
      total,
      couponCode: appliedCoupon || undefined,
      ...(orderImages.length > 0 ? { orderImages } : {}),
      paymentMethod,
      paymentRef: values.paymentRef,
      status: 'pending',
      statusHistory: [{ status: 'pending', at: Date.now() }],
      ...(crateTotal > 0 ? { crateTotal } : {}),
      ...(advanceRequired
        ? {
            advancePaid: advanceCharge,
            advanceMethod:
              paymentMethod === 'nagad'
                ? ('nagad' as const)
                : paymentMethod === 'bank'
                  ? ('bank' as const)
                  : ('bkash' as const),
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

    if (!isBuyNow) clear();
    toast.success(t('checkout.success'));
    navigate(`/order/${shortId}`, { replace: true });
  }

  const paymentNumber =
    paymentMethod === 'bkash'
      ? settings.bkashNumber
      : paymentMethod === 'nagad'
        ? settings.nagadNumber
        : '';
  const bankAccount = settings.bankAccount;

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

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">বিভাগ / Division</label>
                  <select className="input mt-1" {...register('division')}>
                    <option value="">Select division</option>
                    {BD_GEO.map((div) => (
                      <option key={div.name} value={div.name}>{div.nameBn} ({div.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">জেলা / District</label>
                  <select className="input mt-1" {...register('district')} disabled={!watchedDivision}>
                    <option value="">Select district</option>
                    {availableDistricts.map((d) => (
                      <option key={d.name} value={d.name}>{d.nameBn} ({d.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">থানা / Thana</label>
                  <select className="input mt-1" {...register('thana')} disabled={!watchedDistrict}>
                    <option value="">Select thana</option>
                    {availableThanas.map((th) => (
                      <option key={th.name} value={th.name}>{th.nameBn} ({th.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">{t('checkout.area')}</label>
                  <input className="input mt-1" placeholder="Mirpur / local area" {...register('area')} />
                </div>
                <div>
                  <label className="label">{t('checkout.note')}</label>
                  <input className="input mt-1" placeholder="e.g. Call before delivery" {...register('note')} />
                </div>
              </div>

              {/* Image upload below shipping address */}
              <div className="mt-3">
                <label className="label">ছবি সংযুক্ত করুন / Attach image (optional)</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {orderImages.map((url, i) => (
                    <div key={url + i} className="group relative">
                      <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setOrderImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-rose-500 p-0.5 text-white shadow group-hover:block"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" /></svg>
                      </button>
                    </div>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-brand-500 hover:text-brand-600 dark:border-white/10">
                    {uploadingOrderImg ? '…' : '+ Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingOrderImg(true);
                        try {
                          const imgbbKey = settings.imgbbApiKey;
                          if (!imgbbKey) {
                            toast.error('Image upload not configured');
                            return;
                          }
                          const formData = new FormData();
                          formData.append('image', file);
                          const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: 'POST', body: formData });
                          const data = await res.json();
                          if (data.success) {
                            setOrderImages((prev) => [...prev, data.data.url]);
                          } else {
                            toast.error('Upload failed');
                          }
                        } catch {
                          toast.error('Upload failed');
                        } finally {
                          setUploadingOrderImg(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Attach any relevant images (e.g. address screenshot, product reference)
                </p>
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
              {enabledMethods.length === 0 ? (
                <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  No payment methods are enabled. Please contact support.
                </div>
              ) : (
                <div
                  className={`grid gap-2 ${enabledMethods.length >= 4 ? 'sm:grid-cols-4' : enabledMethods.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
                >
                  {(
                    [
                      { v: 'bkash', label: t('checkout.bkash') },
                      { v: 'nagad', label: t('checkout.nagad') },
                      { v: 'bank', label: 'Bank transfer' },
                      { v: 'cod', label: t('checkout.cod') },
                    ] as { v: PaymentMethod; label: string }[]
                  )
                    .filter((opt) => enabled[opt.v])
                    .map((opt) => {
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
                          <PaymentBrand method={opt.v} size={28} />
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
              )}
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
                    <PaymentBrand method={paymentMethod} size={28} />
                    <span className="text-xs text-slate-500">(Personal)</span>
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
              {paymentMethod === 'bank' && (
                <div className="mt-4 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-white to-blue-50 p-4 text-sm shadow-sm dark:border-blue-500/40 dark:from-slate-900/60 dark:to-blue-500/10">
                  <p className="text-slate-700 dark:text-slate-200">
                    Transfer{' '}
                    <span className="font-bold">
                      {formatBDT(advanceRequired ? advanceCharge : total)}
                    </span>{' '}
                    to the account below:
                  </p>
                  {bankAccount && (bankAccount.bankName || bankAccount.accountNumber) ? (
                    <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
                      {bankAccount.bankName && (
                        <>
                          <dt className="text-slate-500">Bank</dt>
                          <dd className="font-semibold">{bankAccount.bankName}</dd>
                        </>
                      )}
                      {bankAccount.accountName && (
                        <>
                          <dt className="text-slate-500">Account name</dt>
                          <dd className="font-semibold">{bankAccount.accountName}</dd>
                        </>
                      )}
                      {bankAccount.accountNumber && (
                        <>
                          <dt className="text-slate-500">Account no.</dt>
                          <dd className="font-mono font-bold">{bankAccount.accountNumber}</dd>
                        </>
                      )}
                      {bankAccount.branch && (
                        <>
                          <dt className="text-slate-500">Branch</dt>
                          <dd>{bankAccount.branch}</dd>
                        </>
                      )}
                      {bankAccount.routingNumber && (
                        <>
                          <dt className="text-slate-500">Routing no.</dt>
                          <dd className="font-mono">{bankAccount.routingNumber}</dd>
                        </>
                      )}
                    </dl>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700">
                      Bank details not configured yet. Please contact support before transferring.
                    </p>
                  )}
                  <p className="mt-3 text-[11px] text-slate-500">
                    {advanceRequired
                      ? `After transferring the advance ${formatBDT(advanceCharge)}, paste the bank reference below. The remaining ${formatBDT(codDue)} is collected on delivery.`
                      : 'After transferring, paste the bank reference / tx ID below so we can match the payment to your order.'}
                  </p>
                  <input
                    className="input mt-2"
                    placeholder="Bank reference / transaction ID"
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
            {/* Coupon input */}
            <div className="mt-3">
              <label className="label text-xs">Coupon code</label>
              <div className="mt-1 flex gap-1.5">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="input flex-1 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = couponInput.trim();
                    if (!code) return;
                    const found = coupons.find((c) => c.code === code && c.active);
                    if (found) {
                      if (found.minOrder && subtotal < found.minOrder) {
                        toast.error(`Minimum order ${formatBDT(found.minOrder)} required`);
                        return;
                      }
                      setAppliedCoupon(code);
                      toast.success('Coupon applied!');
                    } else {
                      toast.error('Invalid or expired coupon');
                    }
                  }}
                  className="btn-primary px-3 py-1.5 text-xs"
                >
                  Apply
                </button>
              </div>
              {coupon && (
                <div className="mt-1.5 flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span>
                    {coupon.code}: {coupon.type === 'percent' ? `${coupon.value}% off` : `${formatBDT(coupon.value)} off`}
                  </span>
                  <button type="button" onClick={() => { setAppliedCoupon(''); setCouponInput(''); }} className="font-bold text-accent-500 hover:underline">Remove</button>
                </div>
              )}
            </div>

            {/* Charge breakdown */}
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatBDT(subtotal)}</dd></div>
              {items.some((it) => it.cratePrice && it.cratePrice > 0) && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Crate / box</dt>
                  <dd>{formatBDT(items.reduce((acc, it) => acc + (it.cratePrice ?? 0), 0))}</dd>
                </div>
              )}
              {standardSubtotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Shipping{hasMango ? ' (standard)' : ''}
                    {watchedDistrict && <span className="ml-1 text-[10px]">({watchedDistrict})</span>}
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
                <div className="flex justify-between"><dt className="text-slate-500">Discount {coupon && <span className="text-[10px]">({coupon.code})</span>}</dt><dd className="text-accent-600">- {formatBDT(discount)}</dd></div>
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
