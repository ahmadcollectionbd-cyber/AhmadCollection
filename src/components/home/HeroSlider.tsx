import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

export function HeroSlider() {
  const all = useDataStore((s) => s.banners);
  const banners = useMemo(
    () => all.filter((b) => b.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [all],
  );

  return (
    <section className="section pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-soft shadow-glass dark:border-white/10">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          effect="fade"
          pagination={{ clickable: true }}
          loop
          className="hero-swiper"
        >
          {banners.map((b, idx) => (
            <SwiperSlide key={b.id}>
              <div className="relative aspect-[16/6] min-h-[260px] w-full overflow-hidden md:aspect-[16/5]">
                <img
                  src={b.image}
                  alt={b.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/40 to-transparent dark:from-slate-950/85 dark:via-slate-950/40" />
                <div className="relative z-10 flex h-full items-center px-6 sm:px-12">
                  <motion.div
                    key={`${b.id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-xl"
                  >
                    <span className="badge-brand text-[10px] uppercase tracking-widest">
                      {b.order === 1 ? 'New Arrivals' : b.order === 2 ? 'Trusted Quality' : 'Limited Offer'}
                    </span>
                    <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
                      {b.title}
                    </h1>
                    {b.subtitle && (
                      <p className={`mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 ${/[\u0980-\u09FF]/.test(b.subtitle) ? 'font-bn' : ''}`}>
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
              </div>
            </SwiperSlide>
          ))}
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
