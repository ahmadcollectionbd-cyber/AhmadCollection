import { Link } from 'react-router-dom';
import { useDataStore } from '../../stores/dataStore';
import { useTranslation } from 'react-i18next';
import { useLangStore } from '../../stores/langStore';
import { motion } from 'framer-motion';

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c, i) => {
          const count = products.filter((p) => p.categoryIds.includes(c.id)).length;
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
                className="group relative block overflow-hidden rounded-2xl border border-white/40 bg-white/80 p-4 backdrop-blur transition hover:-translate-y-1 hover:shadow-glow-brand dark:border-white/10 dark:bg-slate-900/60"
              >
                <div className="aspect-square overflow-hidden rounded-xl bg-gradient-soft">
                  {c.image && (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  )}
                </div>
                <div className="mt-3">
                  <div className={`text-sm font-semibold ${lang === 'bn' ? 'font-bn' : ''}`}>
                    {lang === 'bn' && c.nameBn ? c.nameBn : c.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{count} items</div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
