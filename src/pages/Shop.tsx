import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDataStore } from '../stores/dataStore';
import { ProductCard } from '../components/product/ProductCard';
import { useLangStore } from '../stores/langStore';
import { FiFilter } from 'react-icons/fi';
import { ProductCardSkeleton } from '../components/ui/Skeleton';

export function Shop() {
  const products = useDataStore((s) => s.products);
  const categories = useDataStore((s) => s.categories);
  const ready = useDataStore((s) => s.ready);
  const lang = useLangStore((s) => s.lang);
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'newest';

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat) {
      const c = categories.find((c) => c.slug === cat);
      if (c) list = list.filter((p) => p.categoryIds.includes(c.id));
    }
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.nameBn?.toLowerCase().includes(needle) ||
          p.tags?.some((t) => t.toLowerCase().includes(needle)),
      );
    }
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [products, categories, cat, q, sort]);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  }

  return (
    <>
      <Helmet>
        <title>Shop — Ahmad Collection</title>
      </Helmet>
      <section className="section mt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="badge-brand text-[10px] uppercase tracking-widest">Shop</span>
            <h1 className="heading mt-2 text-2xl font-extrabold sm:text-3xl">
              {q
                ? `Results for "${q}"`
                : cat
                  ? (categories.find((c) => c.slug === cat)?.name ?? 'All Products')
                  : 'All Products'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} products</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input h-9 py-1.5 text-xs"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="mb-5 -mx-1 flex items-center gap-2 overflow-x-auto px-1 scrollbar-hide">
          <FiFilter className="h-4 w-4 shrink-0 text-slate-500" />
          <button
            onClick={() => setParam('cat', '')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cat === '' ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand-500/40 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam('cat', c.slug)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cat === c.slug ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand-500/40 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300'} ${lang === 'bn' && c.nameBn ? 'font-bn' : ''}`}
            >
              {lang === 'bn' && c.nameBn ? c.nameBn : c.name}
            </button>
          ))}
        </div>

        {products.length === 0 && !ready ? (
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            aria-busy="true"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center text-sm text-slate-500">No products found. Try a different filter.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
