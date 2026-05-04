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
    <section className="section mt-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="badge-brand text-[10px] uppercase tracking-widest">Categories</span>
          <h2 className="heading mt-2 text-2xl font-extrabold sm:text-3xl">{t('home.categoriesTitle')}</h2>
        </div>
        <Link to="/shop" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
          {t('home.viewAll')} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {categories.map((c, i) => {
          const count = products.filter((p) => p.categoryIds.includes(c.id)).length;
          const visual = CATEGORY_VISUALS[c.slug] ?? { emoji: '🛒', gradient: 'from-brand-500 to-brand-600' };
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link
                to={`/shop?cat=${c.slug}`}
                className="group relative block overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-4 backdrop-blur transition hover:-translate-y-1 hover:shadow-glow-brand dark:border-white/10 dark:bg-slate-900/60"
              >
                <div
                  className={`relative aspect-[5/3] overflow-hidden rounded-2xl bg-gradient-to-br ${visual.gradient} shadow-inner`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_60%)]" />
                  <div className="absolute right-3 top-3 h-12 w-12 rounded-full bg-white/30 blur-2xl" />
                  <div className="relative flex h-full items-center justify-center text-5xl drop-shadow-md transition duration-500 group-hover:scale-110 sm:text-6xl">
                    {visual.emoji}
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`text-sm font-bold ${lang === 'bn' ? 'font-bn' : ''}`}>
                    {lang === 'bn' && c.nameBn ? c.nameBn : c.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {count} {count === 1 ? 'item' : 'items'}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
