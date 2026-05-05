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
 * Professional split-layout hero slide:
 *  - Desktop (≥ md): two-column grid — text + CTA on the left, full image on
 *    the right. Image uses `object-contain` so nothing is cropped.
 *  - Mobile: stacked — image on top, text + CTA underneath.
 *
 * The banner's `title`, `subtitle` and `ctaLabel` from the admin panel are
 * used verbatim. If a slide has a hand-crafted bengali version in
 * `SLIDE_CONTENT`, that takes priority for the seed banners. New
 * user-uploaded banners just use the strings the admin typed in.
 */
function SplitSlide({ banner, eager }: { banner: Banner; eager: boolean }) {
  const preset = SLIDE_CONTENT[banner.id];
  const titleLine1 = preset?.titleBn[0] ?? banner.title;
  const titleLine2 = preset?.titleBn[1];
  const subtitle = preset?.subtitleBn ?? banner.subtitle;
  const ctaLabel = preset?.ctaBn ?? banner.ctaLabel ?? 'Shop now';

  return (
    <div className="relative bg-gradient-soft dark:bg-slate-900">
      <div className="section grid items-center gap-6 py-8 md:grid-cols-2 md:gap-10 md:py-12 lg:gap-14 lg:py-16">
        {/* Image column — order-1 on mobile so it sits ABOVE the text. */}
        <div className="order-1 flex items-center justify-center md:order-2">
          <img
            src={banner.image}
            alt={banner.title}
            loading={eager ? 'eager' : 'lazy'}
            className="block max-h-[40vh] w-full rounded-2xl object-contain shadow-soft md:max-h-[60vh]"
          />
        </div>

        {/* Text + CTA column. */}
        <motion.div
          key={`${banner.id}-text`}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="order-2 max-w-xl text-center md:order-1 md:text-left"
        >
          <h1 className="font-bn text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl dark:text-white">
            {titleLine1}
          </h1>
          {titleLine2 && (
            <h2 className="font-bn mt-1 text-xl font-bold leading-tight text-brand-700 sm:text-2xl md:text-3xl lg:text-4xl dark:text-brand-300">
              {titleLine2}
            </h2>
          )}
          {subtitle && (
            <p className="font-bn mx-auto mt-4 max-w-md text-sm text-slate-600 sm:text-base md:mx-0 dark:text-slate-300">
              {subtitle}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            {banner.ctaHref && (
              <Link
                to={banner.ctaHref}
                className="font-bn inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl"
              >
                <FiShoppingCart className="h-4 w-4" />
                {ctaLabel}
              </Link>
            )}
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur-sm transition hover:border-brand-500 hover:text-brand-600 dark:border-white/20 dark:bg-white/5 dark:text-slate-100"
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

/**
 * Image-only slide for fully-composed artwork that already contains its
 * own text, products and call-to-action baked in. We just render the
 * uploaded image at its natural aspect ratio (no crop, no overlay)
 * and wrap it in the link if the admin specified one.
 */
function ContainSlide({ banner, eager }: { banner: Banner; eager: boolean }) {
  const slide = (
    <div className="flex w-full items-center justify-center bg-gradient-soft dark:bg-slate-900">
      <img
        src={banner.image}
        alt={banner.title}
        loading={eager ? 'eager' : 'lazy'}
        className="max-h-[60vh] w-full object-contain sm:max-h-[70vh]"
      />
    </div>
  );
  if (banner.ctaHref) {
    return (
      <Link to={banner.ctaHref} aria-label={banner.title} className="block">
        {slide}
      </Link>
    );
  }
  return slide;
}

/**
 * Legacy "background photo + bengali overlay" slide. Kept for banners
 * explicitly opted into `fitMode === 'cover'`.
 */
function CoverSlide({ banner, index }: { banner: Banner; index: number }) {
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
          const fit = b.fitMode ?? 'split';
          return (
            <SwiperSlide key={b.id}>
              {fit === 'cover' ? (
                <CoverSlide banner={b} index={idx} />
              ) : fit === 'contain' ? (
                <ContainSlide banner={b} eager={idx === 0} />
              ) : (
                <SplitSlide banner={b} eager={idx === 0} />
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
