import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { motion } from 'framer-motion';
import { FiArrowRight, FiPhone } from 'react-icons/fi';

const PHONE = '+8801914138238';
const PHONE_DISPLAY = '+880 1914-138238';

interface SlideTheme {
  badge: string;
  badgeBn: string;
  bgGradient: string;
  accent: string;
  patternColor: string;
}

const SLIDE_THEMES: Record<string, SlideTheme> = {
  'b-1': {
    badge: 'New Arrivals',
    badgeBn: 'নতুন কালেকশন',
    bgGradient: 'from-emerald-50 via-emerald-100 to-amber-50',
    accent: 'from-brand-700 to-brand-500',
    patternColor: 'rgba(14,81,50,0.08)',
  },
  'b-2': {
    badge: 'Mustard Oil',
    badgeBn: 'সরিষার তেল',
    bgGradient: 'from-amber-50 via-yellow-100 to-orange-100',
    accent: 'from-amber-600 to-yellow-700',
    patternColor: 'rgba(202,138,4,0.12)',
  },
  'b-3': {
    badge: 'Khejur Gur',
    badgeBn: 'খেজুর গুড়',
    bgGradient: 'from-amber-100 via-orange-50 to-rose-50',
    accent: 'from-amber-700 to-orange-700',
    patternColor: 'rgba(180,83,9,0.12)',
  },
  'b-4': {
    badge: 'Mango Season',
    badgeBn: 'আমের মৌসুম',
    bgGradient: 'from-emerald-50 via-lime-100 to-yellow-100',
    accent: 'from-emerald-700 to-lime-600',
    patternColor: 'rgba(5,150,105,0.12)',
  },
  'b-5': {
    badge: 'Dates & Attar',
    badgeBn: 'খেজুর ও আতর',
    bgGradient: 'from-rose-50 via-amber-50 to-yellow-100',
    accent: 'from-rose-700 to-amber-700',
    patternColor: 'rgba(190,18,60,0.12)',
  },
};

const DEFAULT_THEME: SlideTheme = SLIDE_THEMES['b-1'];

export function HeroSlider() {
  const all = useDataStore((s) => s.banners);
  const banners = useMemo(
    () => all.filter((b) => b.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [all],
  );

  return (
    <section className="section pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/40 shadow-glass dark:border-white/10">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          autoplay={{ delay: 5500, disableOnInteraction: false }}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          pagination={{ clickable: true }}
          loop
          className="hero-swiper"
        >
          {banners.map((b, idx) => {
            const theme = SLIDE_THEMES[b.id] ?? DEFAULT_THEME;
            const isFirst = b.id === 'b-1';
            const subtitleIsBn = b.subtitle ? /[\u0980-\u09FF]/.test(b.subtitle) : false;
            const titleIsBn = /[\u0980-\u09FF]/.test(b.title);
            return (
              <SwiperSlide key={b.id}>
                <div
                  className={`relative aspect-[16/9] min-h-[320px] w-full overflow-hidden bg-gradient-to-br ${theme.bgGradient} sm:aspect-[16/7] md:aspect-[16/6] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950`}
                >
                  {/* Decorative mandala pattern */}
                  <div
                    className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full opacity-30"
                    style={{
                      background: `radial-gradient(circle at center, ${theme.patternColor}, transparent 60%)`,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full opacity-30"
                    style={{
                      background: `radial-gradient(circle at center, ${theme.patternColor}, transparent 60%)`,
                    }}
                  />

                  {isFirst ? (
                    /* Cover banner — full bleed image */
                    <>
                      <img
                        src={b.image}
                        alt={b.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-transparent dark:from-slate-950/85 dark:via-slate-950/40" />
                      <div className="relative z-10 flex h-full items-center px-6 sm:px-12">
                        <motion.div
                          key={`${b.id}-${idx}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6 }}
                          className="max-w-xl"
                        >
                          <span className="badge-brand text-[10px] uppercase tracking-widest">
                            {theme.badge}
                          </span>
                          <h1
                            className={`mt-3 font-display text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl ${titleIsBn ? 'font-bn' : ''}`}
                          >
                            {b.title}
                          </h1>
                          {b.subtitle && (
                            <p
                              className={`mt-3 text-sm text-slate-700 dark:text-slate-300 sm:text-base ${subtitleIsBn ? 'font-bn' : ''}`}
                            >
                              {b.subtitle}
                            </p>
                          )}
                          {b.ctaHref && b.ctaLabel && (
                            <Link to={b.ctaHref} className="btn-primary mt-5 px-6 py-3 text-sm">
                              {b.ctaLabel}
                              <FiArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                        </motion.div>
                      </div>
                    </>
                  ) : (
                    /* Founder-photo split-layout banner */
                    <div className="relative z-10 grid h-full grid-cols-1 sm:grid-cols-12">
                      {/* Text panel */}
                      <motion.div
                        key={`${b.id}-text-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="z-10 flex flex-col justify-center px-6 py-8 sm:col-span-7 sm:px-10 md:px-14 md:py-10 lg:col-span-6"
                      >
                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-md`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          {theme.badge}
                        </span>
                        <h2
                          className={`mt-4 font-display text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl ${titleIsBn ? 'font-bn' : ''}`}
                        >
                          {b.title}
                        </h2>
                        <span
                          className={`mt-1 text-xs font-semibold uppercase tracking-widest text-brand-700/70 dark:text-brand-300/70 ${theme.badgeBn ? 'font-bn' : ''}`}
                        >
                          {theme.badgeBn} • Ahmad Collection
                        </span>
                        {b.subtitle && (
                          <p
                            className={`mt-3 max-w-md text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base ${subtitleIsBn ? 'font-bn' : ''}`}
                          >
                            {b.subtitle}
                          </p>
                        )}
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          {b.ctaHref && b.ctaLabel && (
                            <Link to={b.ctaHref} className="btn-primary px-5 py-2.5 text-sm">
                              {b.ctaLabel}
                              <FiArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                          <a
                            href={`tel:${PHONE}`}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-100"
                          >
                            <FiPhone className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Call</span>
                            <span>{PHONE_DISPLAY}</span>
                          </a>
                        </div>
                      </motion.div>

                      {/* Photo panel */}
                      <motion.div
                        key={`${b.id}-img-${idx}`}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative h-full sm:col-span-5 lg:col-span-6"
                      >
                        <div className="absolute inset-0">
                          <img
                            src={b.image}
                            alt={b.title}
                            className="h-full w-full object-cover object-center"
                            loading={idx === 0 ? 'eager' : 'lazy'}
                          />
                          {/* Soft fade from text side into the photo */}
                          <div
                            className={`absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/60 to-transparent dark:from-slate-900 dark:via-slate-900/50`}
                          />
                          {/* Brand corner accent */}
                          <div
                            className={`absolute right-3 top-3 hidden rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg sm:block`}
                          >
                            Ahmad Collection
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(14, 81, 50, 0.45);
          opacity: 1;
          width: 24px;
          height: 4px;
          border-radius: 9999px;
          transition: all 0.2s;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: linear-gradient(90deg, #0e5132, #c81e1e);
          width: 36px;
        }
      `}</style>
    </section>
  );
}
