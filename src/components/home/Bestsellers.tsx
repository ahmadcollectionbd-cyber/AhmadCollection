import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../product/ProductCard';
import { FiArrowRight, FiZap } from 'react-icons/fi';

export function Bestsellers() {
  const { t } = useTranslation();
  const all = useDataStore((s) => s.products);
  const products = useMemo(() => all.filter((p) => p.bestseller).slice(0, 4), [all]);
  if (!products.length) return null;

  return (
    <section className="section mt-14">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
            <FiZap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="heading text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{t('home.bestsellers')}</h2>
            <p className="mt-0.5 text-sm text-slate-500">Most popular picks</p>
          </div>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50/50 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 hover:shadow-sm dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300">
          {t('home.viewAll')}
          <FiArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
