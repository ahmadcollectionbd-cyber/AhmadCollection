import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../product/ProductCard';
import { FiArrowRight } from 'react-icons/fi';
import { ProductGridSkeleton } from '../ui/Skeleton';

export function FeaturedProducts() {
  const { t } = useTranslation();
  const all = useDataStore((s) => s.products);
  const ready = useDataStore((s) => s.ready);
  const products = useMemo(() => all.filter((p) => p.featured).slice(0, 8), [all]);

  // While the catalog is still loading, render a placeholder grid so
  // the page layout stays put and the bundled sample products are
  // never visible to customers. Once realtime is ready and there are
  // simply no featured items, hide the section.
  if (all.length === 0) {
    if (!ready) return <ProductGridSkeleton title={t('home.featured')} subtitle="Hand-picked for you" />;
    return null;
  }
  if (products.length === 0) return null;

  return (
    <section className="section mt-14">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="heading text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{t('home.featured')}</h2>
          <p className="mt-1 text-sm text-slate-500">Hand-picked for you</p>
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
