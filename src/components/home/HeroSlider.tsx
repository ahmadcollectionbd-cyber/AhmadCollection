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

interface SlideContent {
  titleBn: [string, string];
  subtitleBn: string;
  ctaBn: string;
  bgGradient: string;
  accentColor: string;
}

const SLIDE_CONTENT: Record<string, SlideContent> = {
  'b-1': {
    titleBn: ['খাঁটি ও বিশুদ্ধ পণ্য', 'এখন আপনার হাতের নাগালে'],
    subtitleBn: 'সুলভ মূল্যে বিশ্বস্ততার সাথে প্রিমিয়াম কোয়ালিটির প্রাকৃতিক পণ্য পৌঁছে যাক আপনার ঘরে।',
    ctaBn: 'এখনই কিনুন',
    bgGradient: 'from-brand-500 via-brand-600 to-brand-700',
    accentColor: '#4ade80',
  },
  'b-2': {
    titleBn: ['খাঁটি সরিষার তেল', 'কাঠের ঘানিতে ভাঙানো'],
    subtitleBn: '১০০% খাঁটি কোল্ড প্রেসড সরিষার তেল, কোনো ভেজাল নেই। সারাদেশে ডেলিভারি।',
    ctaBn: 'এখনই অর্ডার করুন',
    bgGradient: 'from-[#1a5c2a] via-[#0e5132] to-[#0a3f27]',
    accentColor: '#fbbf24',
  },
  'b-3': {
    titleBn: ['খাঁটি খেজুর গুড়', 'মাটির পাত্রে বানানো'],
    subtitleBn: 'গাছের খাঁটি রস থেকে তৈরি পাটালি গুড়, শীতের বিশেষ সংগ্রহ।',
    ctaBn: 'এখনই কিনুন',
    bgGradient: 'from-[#3d1e06] via-[#5a2d0a] to-[#7a3d10]',
    accentColor: '#fb923c',
  },
  'b-4': {
    titleBn: ['সাতক্ষীরার আম', 'প্রকৃতিকভাবে পাকা'],
    subtitleBn: 'কোনো কেমিক্যাল ছাড়া প্রাকৃতিকভাবে পাকা আম, সারাদেশে ডেলিভারি।',
    ctaBn: 'প্রি-অর্ডার করুন',
    bgGradient: 'from-brand-500 via-[#0d6b3f] to-[#0a5530]',
    accentColor: '#a3e635',
  },
  'b-5': {
    titleBn: ['প্রিমিয়াম খেজুর ও আতর', 'রমজানের বিশেষ অফার'],
    subtitleBn: 'মরিয়ম ও আজওয়া খেজুর এবং অ্যালকোহল-মুক্ত আতর, ১০০% হালাল অরিজিনাল।',
    ctaBn: 'এখনই কিনুন',
    bgGradient: 'from-[#1a4a2a] via-brand-500 to-brand-600',
    accentColor: '#c084fc',
  },
};

const DEFAULT_CONTENT: SlideContent = SLIDE_CONTENT['b-1'];

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
          const content = SLIDE_CONTENT[b.id] ?? DEFAULT_CONTENT;
          return (
            <SwiperSlide key={b.id}>
              <div
                className={`relative w-full overflow-hidden bg-gradient-to-br ${content.bgGradient} min-h-[420px] sm:min-h-[380px] md:min-h-[440px] lg:min-h-[480px]`}
              >
                {/* Decorative circles */}
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
                <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-white/5" />
                <div className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-white/5" />

                <div className="section relative z-10 grid grid-cols-12 items-center gap-4 py-10 sm:py-12 md:py-16 lg:py-20">
                  {/* LEFT — text panel */}
                  <motion.div
                    key={`${b.id}-text-${idx}`}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="order-2 col-span-12 sm:order-1 sm:col-span-7 md:col-span-6"
                  >
                    <h1 className="font-bn text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                      {content.titleBn[0]}
                    </h1>
                    <h2 className="font-bn mt-1 text-xl font-bold leading-tight text-white/80 sm:text-2xl md:text-3xl lg:text-4xl">
                      {content.titleBn[1]}
                    </h2>

                    <p className="font-bn mt-4 max-w-lg text-sm text-white/70 sm:text-base">
                      {content.subtitleBn}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      {b.ctaHref && (
                        <Link
                          to={b.ctaHref}
                          className="font-bn inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                        >
                          <FiShoppingCart className="h-4 w-4" />
                          {content.ctaBn}
                        </Link>
                      )}
                      <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                      >
                        Browse All
                        <FiArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>

                  {/* RIGHT — banner image */}
                  <motion.div
                    key={`${b.id}-img-${idx}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative order-1 col-span-12 sm:order-2 sm:col-span-5 md:col-span-6"
                  >
                    <div className="relative mx-auto h-48 w-full max-w-md sm:h-64 md:h-80 lg:h-96">
                      <div className="absolute inset-0 rounded-3xl bg-white/10 backdrop-blur-sm" />
                      <img
                        src={b.image}
                        alt={b.title}
                        className="relative h-full w-full rounded-3xl object-cover object-center shadow-2xl"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      <style>{`
        .hero-swiper, .hero-swiper .swiper-wrapper, .hero-swiper .swiper-slide {
          height: auto !important;
        }
        .hero-swiper .swiper-pagination {
          bottom: 20px !important;
        }
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.4);
          opacity: 1;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          transition: all 0.3s;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: white;
          width: 28px;
        }
      `}</style>
    </section>
  );
}
