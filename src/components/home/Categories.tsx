import { Link } from 'react-router-dom';
import { useDataStore } from '../../stores/dataStore';
import { useTranslation } from 'react-i18next';
import { useLangStore } from '../../stores/langStore';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const CATEGORY_VISUALS: Record<string, { emoji: string; bg: string }> = {
  honey: { emoji: '🍯', bg: 'bg-amber-50' },
  honeycomb: { emoji: '🐝', bg: 'bg-yellow-50' },
  'khejur-gur': { emoji: '🥮', bg: 'bg-orange-50' },
  'mustard-oil': { emoji: '🫒', bg: 'bg-lime-50' },
  ghee: { emoji: '🧈', bg: 'bg-yellow-50' },
  mango: { emoji: '🥭', bg: 'bg-orange-50' },
  attar: { emoji: '💎', bg: 'bg-purple-50' },
  dates: { emoji: '🌴', bg: 'bg-amber-50' },
  spices: { emoji: '🌶️', bg: 'bg-red-50' },
  chocolate: { emoji: '🍫', bg: 'bg-stone-50' },
};

export function Categories() {
  const { t } = useTranslation();
  const lang = useLangStore((s) => s.lang);
  const categories = useDataStore((s) => s.categories);
  const products = useDataStore((s) => s.products);

  return (
    <section className="section mt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="heading text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{t('home.categoriesTitle')}</h2>
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
          {t('home.viewAll')}
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:gap-4">
        {categories.map((c, i) => {
          const count = products.filter((p) => p.categoryIds.includes(c.id)).length;
          const visual = CATEGORY_VISUALS[c.slug] ?? { emoji: '🛒', bg: 'bg-slate-50' };
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex-shrink-0"
            >
              <Link
                to={`/shop?cat=${c.slug}`}
                className="group flex w-32 flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/60 sm:w-36"
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${visual.bg} text-3xl transition group-hover:scale-110 sm:h-20 sm:w-20 sm:text-4xl`}>
                  {visual.emoji}
                </div>
                <div className={`mt-3 text-center text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm ${lang === 'bn' ? 'font-bn' : ''}`}>
                  {lang === 'bn' && c.nameBn ? c.nameBn : c.name}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                  {count} {count === 1 ? 'item' : 'items'}
                </div>
              </Link>
            </motion.div>
          );
        })}
        {/* See all button */}
        <div className="flex-shrink-0">
          <Link
            to="/shop"
            className="group flex h-full w-32 flex-col items-center justify-center rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-4 transition hover:bg-brand-50 dark:border-brand-400/30 dark:bg-brand-500/10 sm:w-36"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 transition group-hover:bg-brand-200 dark:bg-brand-500/20 dark:text-brand-300 sm:h-20 sm:w-20">
              <FiArrowRight className="h-6 w-6" />
            </div>
            <div className="mt-3 text-xs font-semibold text-brand-600 dark:text-brand-300 sm:text-sm">See All</div>
          </Link>
        </div>
      </div>
    </section>
  );
}
