import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import type { Banner } from '../../types';

interface SlideContent {
  titleBn: [string, string];
  subtitleBn: string;
  ctaBn: string;
}

const SLIDE_CONTENT: Record<string, SlideContent> = {
  'b-1': {
    titleBn: ['খাঁটি ও বিশুদ্ধ পণ্য', 'এখন আপনার হাতের নাগালে'],
    subtitleBn: 'সুলভ মূল্যে বিশ্বস্ততার সাথে প্রিমিয়াম কোয়ালিটির প্রাকৃতিক পণ্য পৌঁছে যাক আপনার ঘরে।',
    ctaBn: 'এখনই কিনুন',
  },
  'b-3': {
    titleBn: ['খাঁটি খেজুর গুড়', 'মাটির পাত্রে বানানো'],
    subtitleBn: 'গাছের খাঁটি রস থেকে তৈরি পাটালি গুড়, শীতের বিশেষ সংগ্রহ।',
    ctaBn: 'এখনই কিনুন',
  },
  'b-4': {
    titleBn: ['সাতক্ষীরার আম', 'প্রকৃতিকভাবে পাকা'],
    subtitleBn: 'কোনো কেমিক্যাল ছাড়া প্রাকৃতিকভাবে পাকা আম, সারাদেশে ডেলিভারি।',
    ctaBn: 'প্রি-অর্ডার করুন',
  },
  'b-5': {
    titleBn: ['প্রিমিয়াম খেজুর ও আতর', 'রমজানের বিশেষ অফার'],
    subtitleBn: 'মরিয়ম ও আজওয়া খেজুর এবং অ্যালকোহল-মুক্ত আতর, ১০০% হালাল অরিজিনাল।',
    ctaBn: 'এখনই কিনুন',
  },
};

const DEFAULT_CONTENT: SlideContent = SLIDE_CONTENT['b-1'];

/**
 * Full-width banner slide.
 *
 * Mobile: 1:1 aspect ratio, image center-cropped so the main subject
 * stays visible. Text overlay is sized for thumb reach with large
 * tap-targets.
 *
 * Desktop (md+): natural aspect ratio, full image visible.
 */
function ContainSlide({
  banner,
  eager,
  index,
}: {
  banner: Banner;
  eager: boolean;
  index: number;
}) {
  const preset = SLIDE_CONTENT[banner.id];
  const titleLine1 = preset?.titleBn[0] ?? banner.title;
  const titleLine2 = preset?.titleBn[1];
  const subtitle = preset?.subtitleBn ?? banner.subtitle;
  const ctaLabel = preset?.ctaBn ?? banner.ctaLabel ?? 'এখনই কিনুন';
  const hasOverlayContent = Boolean(titleLine1 || subtitle || banner.ctaHref);

  return (
    <div className="relative w-full bg-slate-100 dark:bg-slate-900">
      <img
        src={banner.image}
        alt={banner.title}
        loading={eager ? 'eager' : 'lazy'}
        className="block w-full aspect-square object-cover object-center md:aspect-auto md:h-auto md:object-contain md:object-center"
      />
      {hasOverlayContent && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent md:from-black/70 md:via-black/35" />
          <div className="absolute inset-0 flex items-end pb-14 md:items-center md:pb-0">
            <div className="section relative z-10 w-full">
              <motion.div
                key={`${banner.id}-overlay-${index}`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-[75%] sm:max-w-md md:max-w-lg"
              >
                {titleLine1 && (
                  <h1 className="font-bn text-xl font-extrabold leading-snug text-white drop-shadow-lg sm:text-2xl md:text-4xl lg:text-5xl">
                    {titleLine1}
                  </h1>
                )}
                {titleLine2 && (
                  <h2 className="font-bn mt-0.5 text-base font-bold leading-snug text-white/90 drop-shadow-md sm:text-xl md:text-3xl lg:text-4xl">
                    {titleLine2}
                  </h2>
                )}
                {subtitle && (
                  <p className="font-bn mt-1.5 line-clamp-2 max-w-xs text-xs leading-relaxed text-white/80 drop-shadow sm:mt-3 sm:line-clamp-none sm:max-w-md sm:text-sm md:text-base">
                    {subtitle}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
                  {banner.ctaHref && (
                    <Link
                      to={banner.ctaHref}
                      className="font-bn inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl sm:gap-2 sm:px-6 sm:py-3"
                    >
                      <FiShoppingCart className="h-4 w-4" />
                      {ctaLabel}
                    </Link>
                  )}
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:gap-2 sm:px-5 sm:py-2.5"
                  >
                    Browse All
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Background-photo slide with bengali overlay.
 *
 * Mobile: 1:1 square crop, image center-cropped so the subject stays
 * visible. Text sits near the bottom with generous tap-target buttons.
 *
 * Desktop (md+): fixed-height hero with object-cover.
 */
function CoverSlide({
  banner,
  index,
}: {
  banner: Banner;
  index: number;
}) {
  const content = SLIDE_CONTENT[banner.id] ?? DEFAULT_CONTENT;
  const desktopPosition = (banner.imagePosition ?? 'top').replace('-', ' ');
  return (
    <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-900 md:min-h-[440px] lg:min-h-[500px]">
      <img
        src={banner.image}
        alt={banner.title}
        className="hero-slide-img block w-full aspect-square object-cover md:aspect-auto md:absolute md:inset-0 md:h-full md:w-full md:object-cover"
        style={{ '--img-pos': desktopPosition } as React.CSSProperties}
        loading={index === 0 ? 'eager' : 'lazy'}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent md:from-black/70 md:via-black/40" />
      <div className="absolute inset-0 z-10 flex items-end pb-14 md:items-center md:pb-0">
       <div className="section flex w-full items-center py-4 sm:py-10 md:py-20 lg:py-24">
        <motion.div
          key={`${banner.id}-text-${index}`}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-[75%] sm:max-w-md md:max-w-lg"
        >
          <h1 className="font-bn text-xl font-extrabold leading-snug text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
            {content.titleBn[0]}
          </h1>
          <h2 className="font-bn mt-0.5 text-base font-bold leading-snug text-white/90 drop-shadow-md sm:text-2xl md:text-3xl lg:text-4xl">
            {content.titleBn[1]}
          </h2>

          <p className="font-bn mt-1.5 line-clamp-2 max-w-xs text-xs leading-relaxed text-white/80 drop-shadow sm:mt-4 sm:line-clamp-none sm:max-w-md sm:text-base">
            {content.subtitleBn}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
            {banner.ctaHref && (
              <Link
                to={banner.ctaHref}
                className="font-bn inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl sm:gap-2 sm:px-6 sm:py-3"
              >
                <FiShoppingCart className="h-4 w-4" />
                {content.ctaBn}
              </Link>
            )}
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:gap-2 sm:px-5 sm:py-2.5"
            >
              Browse All
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
       </div>
      </div>
    </div>
  );
}

export function HeroSlider() {
  const all = useDataStore((s) => s.banners);
  const banners = useMemo(
    () => all.filter((b) => b.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [all],
  );

  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        autoHeight
        className="hero-swiper"
      >
        {banners.map((b, idx) => {
          const fit = b.fitMode ?? 'contain';
          return (
            <SwiperSlide key={b.id}>
              {fit === 'cover' ? (
                <CoverSlide banner={b} index={idx} />
              ) : (
                <ContainSlide banner={b} eager={idx === 0} index={idx} />
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
      <style>{`
        .hero-swiper {
          width: 100%;
        }
        /* Smoothly animate the wrapper height when autoHeight reflows so
           transitioning between slides of different aspect ratios doesn't
           snap. */
        .hero-swiper .swiper-wrapper {
          transition-property: transform, height;
        }
        .hero-swiper .swiper-pagination {
          bottom: 8px !important;
        }
        @media (min-width: 768px) {
          .hero-swiper .swiper-pagination {
            bottom: 16px !important;
          }
        }
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(15, 23, 42, 0.35);
          opacity: 1;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          transition: all 0.3s;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: var(--color-brand, #16a34a);
          width: 24px;
        }
        .hero-slide-img {
          object-position: center;
        }
        @media (min-width: 768px) {
          .hero-slide-img {
            object-position: var(--img-pos, top);
          }
        }
      `}</style>
    </section>
  );
}
