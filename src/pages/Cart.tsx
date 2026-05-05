import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCartStore } from '../stores/cartStore';
import { useDataStore } from '../stores/dataStore';
import { useSettingsStore } from '../stores/settingsStore';
import { computeShipping } from '../lib/settings';
import { formatBDT } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export function Cart() {
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const setQty = useCartStore((s) => s.setQty);
  const subtotal = useCartStore((s) => s.subtotal());
  const coupons = useDataStore((s) => s.coupons);
  const settings = useSettingsStore((s) => s.settings);
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const coupon = appliedCode ? coupons.find((c) => c.code === appliedCode) : null;
  const discount = coupon
    ? coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value
    : 0;
  const shipping = computeShipping(subtotal, 'inside', settings);
  const total = Math.max(0, subtotal - discount + shipping);

  function applyCoupon() {
    const c = coupons.find((x) => x.code.toLowerCase() === code.trim().toLowerCase() && x.active);
    if (!c) return toast.error('Invalid coupon');
    if (c.minOrder && subtotal < c.minOrder) return toast.error(`Minimum order ${formatBDT(c.minOrder)} required`);
    setAppliedCode(c.code);
    toast.success(`Coupon ${c.code} applied!`);
  }

  return (
    <>
      <Helmet><title>Cart — Ahmad Collection</title></Helmet>
      <section className="section mt-8">
        <h1 className="heading text-2xl font-extrabold sm:text-3xl">{t('cart.title')}</h1>
        <p className="text-sm text-slate-500">{items.length} {items.length === 1 ? t('cart.item') : t('cart.items')}</p>

        {items.length === 0 ? (
          <div className="card mt-6 p-12 text-center">
            <FiShoppingCart className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm text-slate-500">{t('cart.empty')}</p>
            <Link to="/shop" className="btn-primary mt-4 inline-flex">{t('cart.continueShopping')}</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.productId} className="card flex gap-4 p-3">
                  <Link to={`/product/${it.slug}`} className="shrink-0">
                    <img src={it.image} alt={it.name} className="h-24 w-24 rounded-xl object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link to={`/product/${it.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-brand-600">{it.name}</Link>
                    <div className="mt-1 text-sm font-bold text-brand-700 dark:text-brand-300">{formatBDT(it.price)}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-white/10">
                        <button onClick={() => setQty(it.productId, it.quantity - 1)} className="px-3 py-1.5">−</button>
                        <span className="min-w-8 text-center text-sm font-semibold">{it.quantity}</span>
                        <button onClick={() => setQty(it.productId, it.quantity + 1)} className="px-3 py-1.5">+</button>
                      </div>
                      <button onClick={() => remove(it.productId)} className="text-xs text-accent-500 hover:underline inline-flex items-center gap-1">
                        <FiTrash2 className="h-3.5 w-3.5" />
                        {t('cart.remove')}
                      </button>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right text-sm font-bold">{formatBDT(it.price * it.quantity)}</div>
                </li>
              ))}
            </ul>

            <aside className="card sticky top-24 h-fit p-5">
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('cart.coupon')}
                  className="input"
                />
                <button onClick={applyCoupon} className="btn-outline whitespace-nowrap text-xs">{t('cart.apply')}</button>
              </div>
              {appliedCode && (
                <div className="mt-2 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-300">
                  <span>Code <b>{appliedCode}</b> applied</span>
                  <button onClick={() => { setAppliedCode(null); setCode(''); }} className="hover:underline">{t('cart.remove')}</button>
                </div>
              )}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t('cart.subtotal')}</dt>
                  <dd>{formatBDT(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t('cart.shipping')}</dt>
                  <dd>{shipping === 0 ? <span className="text-emerald-600">Free</span> : formatBDT(shipping)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">{t('cart.discount')}</dt>
                    <dd className="text-accent-600">- {formatBDT(discount)}</dd>
                  </div>
                )}
                <div className="border-t border-slate-200/70 pt-2 dark:border-white/10" />
                <div className="flex justify-between text-base font-bold">
                  <dt>{t('cart.total')}</dt>
                  <dd>{formatBDT(total)}</dd>
                </div>
              </dl>
              <button
                onClick={() => navigate('/checkout', { state: { couponCode: appliedCode } })}
                className="btn-primary mt-5 w-full"
              >
                {t('cart.checkout')}
              </button>
              <Link to="/shop" className="btn-ghost mt-2 w-full text-xs">{t('cart.continueShopping')}</Link>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
