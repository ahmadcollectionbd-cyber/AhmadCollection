import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../product/ProductCard';

export function FeaturedProducts() {
  const { t } = useTranslation();
  const all = useDataStore((s) => s.products);
  const products = useMemo(() => all.filter((p) => p.featured).slice(0, 8), [all]);

  return (
    <section className="section mt-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="badge-accent text-[10px] uppercase tracking-widest">Featured</span>
          <h2 className="heading mt-2 text-2xl font-extrabold sm:text-3xl">{t('home.featured')}</h2>
        </div>
        <Link to="/shop" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
          {t('home.viewAll')} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
