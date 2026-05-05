import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../product/ProductCard';
import { FiArrowRight } from 'react-icons/fi';

export function FeaturedProducts() {
  const { t } = useTranslation();
  const all = useDataStore((s) => s.products);
  const products = useMemo(() => all.filter((p) => p.featured).slice(0, 8), [all]);

  return (
    <section className="section mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="heading text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{t('home.featured')}</h2>
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
          {t('home.viewAll')}
          <FiArrowRight className="h-4 w-4" />
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
