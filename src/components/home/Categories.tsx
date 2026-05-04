import { Link } from 'react-router-dom';
import { useDataStore } from '../../stores/dataStore';
import { useTranslation } from 'react-i18next';
import { useLangStore } from '../../stores/langStore';
import { motion } from 'framer-motion';

const CATEGORY_VISUALS: Record<string, { emoji: string; gradient: string }> = {
  honey: { emoji: '🍯', gradient: 'from-amber-300 via-yellow-400 to-orange-400' },
  honeycomb: { emoji: '🐝', gradient: 'from-amber-200 via-amber-400 to-yellow-500' },
  'khejur-gur': { emoji: '🥮', gradient: 'from-amber-700 via-orange-700 to-yellow-800' },
  'mustard-oil': { emoji: '🫒', gradient: 'from-yellow-400 via-amber-500 to-yellow-600' },
  ghee: { emoji: '🧈', gradient: 'from-yellow-200 via-amber-300 to-yellow-400' },
  mango: { emoji: '🥭', gradient: 'from-yellow-400 via-orange-400 to-red-400' },
  attar: { emoji: '💎', gradient: 'from-violet-500 via-fuchsia-500 to-pink-500' },
  dates: { emoji: '🌴', gradient: 'from-amber-600 via-orange-700 to-red-800' },
  spices: { emoji: '🌶️', gradient: 'from-orange-400 via-red-500 to-rose-600' },
  chocolate: { emoji: '🍫', gradient: 'from-amber-700 via-yellow-900 to-stone-800' },
};

export function Categories() {
  const { t } = useTranslation();
  const lang = useLangStore((s) => s.lang);
  const categories = useDataStore((s) => s.categories);
  const products = useDataStore((s) => s.products);

  return (
    <section className="section mt-12">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <span className="badge-brand text-[10px] uppercase tracking-widest">Categories</span>
          <h2 className="heading mt-2 text-xl font-extrabold sm:text-2xl">{t('home.categoriesTitle')}</h2>
        </div>
        <Link to="/shop" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
          {t('home.viewAll')} →
        </Link>
      </div>
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
      >
        {categories.map((c, i) => {
          const count = products.filter((p) => p.categoryIds.includes(c.id)).length;
          const visual = CATEGORY_VISUALS[c.slug] ?? { emoji: '🛒', gradient: 'from-brand-500 to-brand-600' };
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="snap-start"
            >
              <Link
                to={`/shop?cat=${c.slug}`}
                className="group flex w-[88px] flex-col items-center gap-1.5 rounded-2xl px-1 py-1 transition hover:-translate-y-0.5"
                aria-label={lang === 'bn' && c.nameBn ? c.nameBn : c.name}
              >
                <div
                  className={`relative h-[64px] w-[64px] overflow-hidden rounded-full bg-gradient-to-br ${visual.gradient} shadow-md ring-1 ring-white/40 transition group-hover:shadow-glow-brand dark:ring-white/10`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_60%)]" />
                  <div className="relative flex h-full items-center justify-center text-2xl drop-shadow-sm transition duration-300 group-hover:scale-110">
                    {visual.emoji}
                  </div>
                </div>
                <div className={`line-clamp-1 text-center text-[11px] font-semibold leading-tight ${lang === 'bn' ? 'font-bn' : ''}`}>
                  {lang === 'bn' && c.nameBn ? c.nameBn : c.name}
                </div>
                <div className="text-[9px] leading-none text-slate-500">
                  {count} {count === 1 ? 'item' : 'items'}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
