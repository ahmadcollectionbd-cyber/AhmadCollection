import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
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
 * Full-width banner: shows the uploaded image at its natural aspect ratio,
 * filling 100% of the viewport width so there is never any blank space
 * on the sides. The container's height auto-adjusts to whatever the
 * image's intrinsic aspect ratio dictates.
 *
 * On top of the image we render a left-anchored bengali title /
 * subtitle / CTA overlay. A dark left-to-right gradient is layered
 * underneath the text to keep it readable against any background.
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
    <div className="relative w-full">
      <img
        src={banner.image}
        alt={banner.title}
        loading={eager ? 'eager' : 'lazy'}
        className="block h-auto w-full"
      />
      {hasOverlayContent && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent sm:from-black/65 sm:via-black/30 md:from-black/70 md:via-black/35" />
          <div className="absolute inset-0 flex items-center">
            <div className="section relative z-10 w-full">
              <motion.div
                key={`${banner.id}-overlay-${index}`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md sm:max-w-lg"
              >
                {titleLine1 && (
                  <h1 className="font-bn text-xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-2xl md:text-4xl lg:text-5xl">
                    {titleLine1}
                  </h1>
                )}
                {titleLine2 && (
                  <h2 className="font-bn mt-1 text-lg font-bold leading-tight text-white/90 drop-shadow-md sm:text-xl md:text-3xl lg:text-4xl">
                    {titleLine2}
                  </h2>
                )}
                {subtitle && (
                  <p className="font-bn mt-2 hidden max-w-md text-xs text-white/80 drop-shadow sm:mt-3 sm:block sm:text-sm md:text-base">
                    {subtitle}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
                  {banner.ctaHref && (
                    <Link
                      to={banner.ctaHref}
                      className="font-bn inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                    >
                      <FiShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {ctaLabel}
                    </Link>
                  )}
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/40 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
                  >
                    Browse All
                    <FiArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
 * Legacy "background photo + bengali overlay" slide. Kept for older banners
 * that don't have copy baked into the image.
 */
function CoverSlide({
  banner,
  index,
}: {
  banner: Banner;
  index: number;
}) {
  const content = SLIDE_CONTENT[banner.id] ?? DEFAULT_CONTENT;
  return (
    <div className="relative w-full overflow-hidden min-h-[320px] sm:min-h-[380px] md:min-h-[440px] lg:min-h-[500px]">
      <img
        src={banner.image}
        alt={banner.title}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: (banner.imagePosition ?? 'top').replace('-', ' ') }}
        loading={index === 0 ? 'eager' : 'lazy'}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="section relative z-10 flex items-center py-10 sm:py-14 md:py-20 lg:py-24">
        <motion.div
          key={`${banner.id}-text-${index}`}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg"
        >
          <h1 className="font-bn text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-lg">
            {content.titleBn[0]}
          </h1>
          <h2 className="font-bn mt-1 text-xl font-bold leading-tight text-white/90 sm:text-2xl md:text-3xl lg:text-4xl drop-shadow-md">
            {content.titleBn[1]}
          </h2>

          <p className="font-bn mt-4 max-w-md text-sm text-white/80 sm:text-base drop-shadow">
            {content.subtitleBn}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {banner.ctaHref && (
              <Link
                to={banner.ctaHref}
                className="font-bn inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl"
              >
                <FiShoppingCart className="h-4 w-4" />
                {content.ctaBn}
              </Link>
            )}
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Browse All
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
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
        modules={[Autoplay, Pagination, EffectFade]}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        pagination={{ clickable: true }}
        loop
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
        .hero-swiper .swiper-pagination {
          bottom: 16px !important;
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
      `}</style>
    </section>
  );
}
