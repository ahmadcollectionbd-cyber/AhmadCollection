import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiGift,
  FiHeart,
  FiPercent,
  FiShield,
  FiStar,
  FiTruck,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLangStore } from '../../stores/langStore';
import { DEFAULT_HOME_FEATURE_CARDS } from '../../lib/settings';
import type { HomeFeatureCard } from '../../types';

const ICONS: Record<HomeFeatureCard['icon'], IconType> = {
  percent: FiPercent,
  shield: FiShield,
  truck: FiTruck,
  gift: FiGift,
  star: FiStar,
  heart: FiHeart,
};

const PALETTES: Record<HomeFeatureCard['palette'], string> = {
  brand:
    'bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 hover:shadow-brand-500/20',
  amber:
    'bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 hover:shadow-amber-500/20',
  emerald:
    'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 hover:shadow-emerald-500/20',
  rose: 'bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 hover:shadow-rose-500/20',
  violet:
    'bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 hover:shadow-violet-500/20',
  sky: 'bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 hover:shadow-sky-500/20',
};

export function OfferBanner() {
  const settings = useSettingsStore((s) => s.settings);
  const lang = useLangStore((s) => s.lang);
  const cards = (settings.homeFeatureCards ?? DEFAULT_HOME_FEATURE_CARDS()).filter(
    (c) => c.enabled !== false,
  );

  if (cards.length === 0) return null;

  return (
    <section className="section mt-14">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card, i) => {
          const Icon = ICONS[card.icon] ?? FiPercent;
          const palette = PALETTES[card.palette] ?? PALETTES.brand;
          const badge = lang === 'bn' && card.badgeBn ? card.badgeBn : card.badge;
          const title = lang === 'bn' && card.titleBn ? card.titleBn : card.title;
          const subtitle =
            lang === 'bn' && card.subtitleBn ? card.subtitleBn : card.subtitle;
          const cta = lang === 'bn' && card.ctaTextBn ? card.ctaTextBn : card.ctaText;
          const bnFont = lang === 'bn' ? 'font-bn' : '';
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                to={card.link || '/shop'}
                className={`group relative flex min-h-[180px] overflow-hidden rounded-2xl p-7 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[200px] ${palette}`}
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-125" />
                <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-white/5" />
                <div className="relative z-10 flex flex-col justify-center">
                  {badge && (
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${bnFont}`}
                    >
                      <Icon className="h-3 w-3" /> {badge}
                    </span>
                  )}
                  <h3
                    className={`mt-4 text-xl font-extrabold leading-tight sm:text-2xl ${bnFont}`}
                  >
                    {title}
                  </h3>
                  {subtitle && (
                    <p className={`mt-2 max-w-xs text-sm text-white/70 ${bnFont}`}>
                      {subtitle}
                    </p>
                  )}
                  {cta && (
                    <span
                      className={`mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-white/90 transition group-hover:gap-2.5 ${bnFont}`}
                    >
                      {cta}
                      <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </div>
                <div className="ml-auto flex items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24">
                    <Icon className="h-10 w-10 sm:h-12 sm:w-12" />
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
