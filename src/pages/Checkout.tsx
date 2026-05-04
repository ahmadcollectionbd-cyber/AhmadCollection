import { useState } from 'react';
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
import { formatBDT, generateOrderId } from '../lib/utils';
import type { Order, PaymentMethod } from '../types';
import { useTranslation } from 'react-i18next';

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Valid phone required'),
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
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  const couponCode = state?.couponCode;
  const coupon = couponCode ? coupons.find((c) => c.code === couponCode) : null;
  const discount = coupon
    ? coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value
    : 0;
  const shipping = subtotal >= 1500 ? 0 : 70;
  const total = Math.max(0, subtotal - discount + shipping);

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
      email: user?.email,
      customer: {
        name: values.name,
        phone: values.phone,
        address: values.address,
        city: values.city,
        area: values.area,
        note: values.note,
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
    addOrder(order);
    pushNotification({
      id: `n-${Date.now()}`,
      title: 'Order placed',
      body: `Order ${shortId} received. We'll confirm it shortly.`,
      read: false,
      createdAt: Date.now(),
      href: `/order/${shortId}`,
    });
    clear();
    toast.success(t('checkout.success'));
    navigate(`/order/${shortId}`, { replace: true });
  }

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
                    <b>{paymentMethod === 'bkash' ? 'bKash 01914138238' : 'Nagad 01914138238'}</b>{' '}
                    (Personal). Then enter the transaction ID below.
                  </p>
                  <input className="input mt-3" placeholder={t('checkout.paymentRef')} {...register('paymentRef')} />
                </div>
              )}
            </div>
          </div>

          <aside className="card sticky top-24 h-fit p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">Order summary</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
              {items.map((it) => (
                <li key={it.productId} className="flex items-center gap-3 text-sm">
                  <img src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
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
                <div className="flex justify-between"><dt className="text-slate-500">Discount ({coupon?.code})</dt><dd className="text-accent-600">- {formatBDT(discount)}</dd></div>
              )}
              <div className="border-t border-slate-200/70 my-2 dark:border-white/10" />
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatBDT(total)}</dd></div>
            </dl>
            <button type="submit" disabled={isSubmitting} className="btn-primary mt-5 w-full">
              {t('checkout.placeOrder')}
            </button>
            {!user && (
              <p className="mt-2 text-center text-xs text-slate-500">
                Checking out as guest. <Link to="/login" className="text-brand-600 hover:underline">Login</Link>
              </p>
            )}
          </aside>
        </form>
      </section>
    </>
  );
}
