import { Link } from 'react-router-dom';
import { useDataStore } from '../../stores/dataStore';
import { useTranslation } from 'react-i18next';
import { useLangStore } from '../../stores/langStore';
import { FiArrowRight } from 'react-icons/fi';

const CATEGORY_VISUALS: Record<string, { emoji: string; bg: string; border: string }> = {
  honey: { emoji: '🍯', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'group-hover:border-amber-300' },
  honeycomb: { emoji: '🐝', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'group-hover:border-yellow-300' },
  'khejur-gur': { emoji: '🥮', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'group-hover:border-orange-300' },
  'mustard-oil': { emoji: '🫒', bg: 'bg-lime-50 dark:bg-lime-900/20', border: 'group-hover:border-lime-300' },
  ghee: { emoji: '🧈', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'group-hover:border-yellow-300' },
  mango: { emoji: '🥭', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'group-hover:border-orange-300' },
  attar: { emoji: '💎', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'group-hover:border-purple-300' },
  dates: { emoji: '🌴', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'group-hover:border-amber-300' },
  spices: { emoji: '🌶️', bg: 'bg-red-50 dark:bg-red-900/20', border: 'group-hover:border-red-300' },
  chocolate: { emoji: '🍫', bg: 'bg-stone-50 dark:bg-stone-900/20', border: 'group-hover:border-stone-300' },
};

export function Categories() {
  const { t } = useTranslation();
  const lang = useLangStore((s) => s.lang);
  const categories = useDataStore((s) => s.categories);
  const products = useDataStore((s) => s.products);

  // The marquee track contains two consecutive copies of the same list and
  // is animated translateX(0) → translateX(-50%) on a slow loop, so the
  // viewer always sees a continuous, seamless slide. Hover pauses the
  // animation so customers can actually pick a card.
  function renderCard(c: (typeof categories)[number], keySuffix: string) {
    const count = products.filter((p) => p.categoryIds.includes(c.id)).length;
    const visual =
      CATEGORY_VISUALS[c.slug] ?? {
        emoji: '🛒',
        bg: 'bg-slate-50 dark:bg-slate-800/40',
        border: 'group-hover:border-slate-300',
      };
    // Priority: admin-uploaded image > admin-set emoji/icon > legacy slug-based emoji.
    const customIcon = c.icon?.trim();
    return (
      <Link
        key={`${c.id}-${keySuffix}`}
        to={`/shop?cat=${c.slug}`}
        className={`group flex w-32 flex-shrink-0 flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/60 sm:w-36 ${visual.border}`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ${visual.bg} text-3xl transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20 sm:text-4xl`}
        >
          {c.image ? (
            <img
              src={c.image}
              alt={c.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            customIcon || visual.emoji
          )}
        </div>
        <div
          className={`mt-3 text-center text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm ${
            lang === 'bn' ? 'font-bn' : ''
          }`}
        >
          {lang === 'bn' && c.nameBn ? c.nameBn : c.name}
        </div>
        <div className="mt-1 text-[10px] text-slate-400 sm:text-xs">
          {count} {count === 1 ? 'item' : 'items'}
        </div>
      </Link>
    );
  }

  function seeAll(keySuffix: string) {
    return (
      <Link
        key={`see-all-${keySuffix}`}
        to="/shop"
        className="group flex w-32 flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:bg-brand-50 hover:shadow-lg dark:border-brand-400/30 dark:bg-brand-500/10 sm:w-36"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 transition-transform duration-300 group-hover:scale-110 dark:bg-brand-500/20 dark:text-brand-300 sm:h-20 sm:w-20">
          <FiArrowRight className="h-6 w-6" />
        </div>
        <div className="mt-3 text-xs font-semibold text-brand-600 dark:text-brand-300 sm:text-sm">
          See All
        </div>
      </Link>
    );
  }

  function renderTrack(keySuffix: string) {
    return (
      <>
        {categories.map((c) => renderCard(c, keySuffix))}
        {seeAll(keySuffix)}
      </>
    );
  }

  return (
    <section className="section mt-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="heading text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {t('home.categoriesTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Browse by category</p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50/50 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 hover:shadow-sm dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300"
        >
          {t('home.viewAll')}
          <FiArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-sm text-slate-400">No categories yet.</div>
      ) : (
        <div className="relative overflow-hidden" aria-label="Category carousel">
          {/* Soft fade masks on the left/right so cards slide in/out without
              a hard edge on light or dark backgrounds. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent dark:from-slate-950 sm:w-16"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent dark:from-slate-950 sm:w-16"
          />
          <div className="flex w-max animate-marquee-x gap-3 pb-2 [animation-play-state:running] hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-4">
            {renderTrack('a')}
            {renderTrack('b')}
          </div>
        </div>
      )}
    </section>
  );
}
