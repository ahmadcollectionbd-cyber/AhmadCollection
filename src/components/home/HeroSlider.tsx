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
              <div className="relative w-full overflow-hidden min-h-[320px] sm:min-h-[380px] md:min-h-[440px] lg:min-h-[500px]">
                {/* Full-width background image — anchored to the top by
                    default so portraits / faces don't get their heads cropped. */}
                <img
                  src={b.image}
                  alt={b.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: (b.imagePosition ?? 'top').replace('-', ' ') }}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                <div className="section relative z-10 flex items-center py-10 sm:py-14 md:py-20 lg:py-24">
                  <motion.div
                    key={`${b.id}-text-${idx}`}
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
                      {b.ctaHref && (
                        <Link
                          to={b.ctaHref}
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
            </SwiperSlide>
          );
        })}
      </Swiper>
      <style>{`
        .hero-swiper {
          width: 100%;
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
