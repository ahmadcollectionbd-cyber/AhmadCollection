import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiPhone } from 'react-icons/fi';

const PHONE = '+8801914138238';
const PHONE_DISPLAY = '+880 1914-138238';

interface SlideContent {
  /** Bengali main heading (large, dark green) */
  titleBn: [string, string];
  /** Slide-specific badge label shown at top */
  eyebrow: string;
  /** Two short Bengali trust labels with icon type */
  trustBadges: { icon: 'leaf' | 'shield' | 'truck' | 'star'; label: string }[];
  /** Bengali CTA */
  ctaBn: string;
  /** Round corner seal (Bengali, two lines) */
  seal: { line1: string; line2: string };
  /** Background tint */
  bgTone: 'green' | 'amber' | 'rose' | 'mint';
}

const SLIDE_CONTENT: Record<string, SlideContent> = {
  'b-1': {
    titleBn: ['খাঁটি ও বিশুদ্ধ পণ্য', 'এখন আপনার হাতের নাগালে'],
    eyebrow: 'Ahmad Collection',
    trustBadges: [
      { icon: 'leaf', label: 'প্রিমিয়াম কোয়ালিটির পণ্য' },
      { icon: 'shield', label: 'বিশ্বস্ত সার্ভিস' },
    ],
    ctaBn: 'এখনই কিনুন',
    seal: { line1: '১০০%', line2: 'খাঁটি ও\nনির্ভরযোগ্য' },
    bgTone: 'green',
  },
  'b-2': {
    titleBn: ['খাঁটি সরিষার তেল', 'কাঠের ঘানিতে ভাঙানো'],
    eyebrow: 'Mustard Oil',
    trustBadges: [
      { icon: 'leaf', label: '১০০% খাঁটি ঝাঁঝ' },
      { icon: 'shield', label: 'কোনো ভেজাল নেই' },
    ],
    ctaBn: 'এখনই অর্ডার করুন',
    seal: { line1: '১০০%', line2: 'কোল্ড\nপ্রেসড' },
    bgTone: 'amber',
  },
  'b-3': {
    titleBn: ['খাঁটি খেজুর গুড়', 'মাটির পাত্রে বানানো'],
    eyebrow: 'Khejur Gur',
    trustBadges: [
      { icon: 'leaf', label: 'গাছের খাঁটি রস' },
      { icon: 'star', label: 'শীতের বিশেষ' },
    ],
    ctaBn: 'এখনই কিনুন',
    seal: { line1: 'নতুন', line2: 'শীতের\nপাটালি' },
    bgTone: 'rose',
  },
  'b-4': {
    titleBn: ['সাতক্ষীরার আম', 'প্রকৃতিকভাবে পাকা'],
    eyebrow: 'Mango Season',
    trustBadges: [
      { icon: 'leaf', label: 'কোনো কেমিক্যাল নয়' },
      { icon: 'truck', label: 'সারাদেশে ডেলিভারি' },
    ],
    ctaBn: 'প্রি-অর্ডার করুন',
    seal: { line1: 'সিজন', line2: '২০২৬\nহিমসাগর' },
    bgTone: 'mint',
  },
  'b-5': {
    titleBn: ['প্রিমিয়াম খেজুর ও আতর', 'রমজানের বিশেষ অফার'],
    eyebrow: 'Dates & Attar',
    trustBadges: [
      { icon: 'star', label: 'মরিয়ম ও আজওয়া' },
      { icon: 'shield', label: 'অ্যালকোহল-মুক্ত আতর' },
    ],
    ctaBn: 'এখনই কিনুন',
    seal: { line1: '১০০%', line2: 'হালাল\nঅরিজিনাল' },
    bgTone: 'amber',
  },
};

const TONE_PALETTES: Record<SlideContent['bgTone'], { bg: string; wave: string; leaf: string }> = {
  green: {
    bg: 'from-[#f4faf6] via-[#e6f3ec] to-[#c4e3d2]',
    wave: '#0e5132',
    leaf: '#0e5132',
  },
  amber: {
    bg: 'from-[#fdf8eb] via-[#f7ecc8] to-[#e7d59a]',
    wave: '#0e5132',
    leaf: '#0e5132',
  },
  rose: {
    bg: 'from-[#fef5ed] via-[#fbe6d4] to-[#f1c89f]',
    wave: '#7c2d12',
    leaf: '#0e5132',
  },
  mint: {
    bg: 'from-[#f1faf1] via-[#dbf2dc] to-[#a9dfb1]',
    wave: '#0e5132',
    leaf: '#0e5132',
  },
};

const TrustIcon = ({ type, color = '#0e5132' }: { type: SlideContent['trustBadges'][number]['icon']; color?: string }) => {
  switch (type) {
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={color}>
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25-1.74.35-3.41 1.13-4.55 2.36-1.5 1.62-2.45 3.82-2.45 6.39 0 1.57.5 3.06 1.4 4.32C5.5 17.5 8 13 12 11s5-3 5-3z"/>
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={color}>
          <path d="M12 1l9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l9-4zm-1 6v6h2V7h-2zm0 8v2h2v-2h-2z"/>
        </svg>
      );
    case 'truck':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={color}>
          <path d="M3 4h13v9h2.5l3.5 3.5V20h-2a3 3 0 11-6 0H9a3 3 0 11-6 0H1v-2h2V4zm13 11h4v-1.5L17.5 11H16v4zM5 17a1 1 0 102 0 1 1 0 00-2 0zm10 0a1 1 0 102 0 1 1 0 00-2 0z"/>
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
  }
};

const FloatingLeaf = ({ x, y, rot, size = 24, opacity = 0.5 }: { x: string; y: string; rot: number; size?: number; opacity?: number }) => (
  <svg
    viewBox="0 0 24 24"
    className="pointer-events-none absolute"
    style={{ left: x, top: y, width: size, height: size, transform: `rotate(${rot}deg)`, opacity }}
    fill="#16a34a"
  >
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25-1.74.35-3.41 1.13-4.55 2.36-1.5 1.62-2.45 3.82-2.45 6.39 0 1.57.5 3.06 1.4 4.32C5.5 17.5 8 13 12 11s5-3 5-3z" />
  </svg>
);

const DEFAULT_CONTENT: SlideContent = SLIDE_CONTENT['b-1'];

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
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          pagination={{ clickable: true }}
          loop
          className="hero-swiper"
        >
          {banners.map((b, idx) => {
            const content = SLIDE_CONTENT[b.id] ?? DEFAULT_CONTENT;
            const palette = TONE_PALETTES[content.bgTone];
            return (
              <SwiperSlide key={b.id}>
                <div
                  className={`relative h-[440px] w-full overflow-hidden bg-gradient-to-br ${palette.bg} sm:h-[340px] md:h-[360px] lg:h-[380px] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950`}
                >
                  {/* Floating leaves */}
                  <FloatingLeaf x="10%" y="6%" rot={-20} size={28} opacity={0.45} />
                  <FloatingLeaf x="46%" y="10%" rot={45} size={22} opacity={0.35} />
                  <FloatingLeaf x="58%" y="3%" rot={70} size={28} opacity={0.4} />
                  <FloatingLeaf x="4%" y="55%" rot={-110} size={22} opacity={0.35} />
                  <FloatingLeaf x="40%" y="68%" rot={20} size={20} opacity={0.3} />

                  {/* Content grid */}
                  <div className="relative z-10 grid h-full grid-cols-12 items-center gap-2 px-5 pb-14 pt-5 sm:px-8 sm:pb-16 sm:pt-6 md:px-12 md:pb-16 md:pt-6">
                    {/* LEFT — text panel */}
                    <motion.div
                      key={`${b.id}-text-${idx}`}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      className="col-span-12 sm:col-span-7 md:col-span-6"
                    >
                      {/* Logo */}
                      <div className="flex items-center gap-3">
                        <img
                          src="/logo.png"
                          alt="Ahmad Collection"
                          className="h-12 w-auto drop-shadow-sm sm:h-16 md:h-20 lg:h-24"
                        />
                      </div>

                      {/* Title — Bengali, two lines */}
                      <h1 className="font-bn mt-2 text-xl font-extrabold leading-tight text-[#0e5132] dark:text-white sm:text-2xl md:text-[2rem] lg:text-[2.4rem] md:leading-[1.1]">
                        {content.titleBn[0]}
                      </h1>
                      <h2 className="font-bn mt-0.5 text-lg font-extrabold leading-tight text-[#c81e1e] sm:text-xl md:text-[1.65rem] lg:text-[1.95rem]">
                        {content.titleBn[1]}
                      </h2>

                      {/* Divider */}
                      <div className="mt-3 flex items-center gap-2 max-w-[260px]">
                        <span className="h-[2px] flex-1 bg-gradient-to-r from-[#0e5132]/60 to-transparent" />
                        <FloatingLeaf x="0" y="0" rot={0} size={12} opacity={0.6} />
                      </div>

                      {/* Trust badges */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {content.trustBadges.map((badge, i) => (
                          <span
                            key={i}
                            className="font-bn flex items-center gap-1.5 text-xs font-semibold text-[#0e5132] dark:text-emerald-200 sm:text-sm"
                          >
                            <TrustIcon type={badge.icon} />
                            {badge.label}
                          </span>
                        ))}
                      </div>

                      {/* CTAs */}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {b.ctaHref && (
                          <Link
                            to={b.ctaHref}
                            className="font-bn inline-flex items-center gap-2 rounded-full bg-[#0e5132] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0a3f27] hover:shadow-glow-brand"
                          >
                            <FiShoppingCart className="h-4 w-4" />
                            {content.ctaBn}
                          </Link>
                        )}
                        <a
                          href={`tel:${PHONE}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#0e5132]/30 bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#0e5132] shadow-sm backdrop-blur transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-emerald-200"
                        >
                          <FiPhone className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Call</span>
                          <span>{PHONE_DISPLAY}</span>
                        </a>
                      </div>
                    </motion.div>

                    {/* RIGHT — founder photo */}
                    <motion.div
                      key={`${b.id}-img-${idx}`}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                      className="relative col-span-12 -mr-5 sm:col-span-5 sm:-mr-8 md:col-span-6 md:-mr-12"
                    >
                      <div className="relative ml-auto h-full max-h-[520px] w-full">
                        <img
                          src={b.image}
                          alt={b.title}
                          className="h-full w-full object-cover object-center"
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          style={{
                            maskImage:
                              'radial-gradient(120% 110% at 70% 50%, black 60%, rgba(0,0,0,0.85) 75%, transparent 100%)',
                            WebkitMaskImage:
                              'radial-gradient(120% 110% at 70% 50%, black 60%, rgba(0,0,0,0.85) 75%, transparent 100%)',
                          }}
                        />

                        {/* 100% Round Seal */}
                        <div className="absolute right-2 top-2 flex h-16 w-16 -rotate-12 flex-col items-center justify-center rounded-full border-[3px] border-white bg-[#0e5132] text-center text-white shadow-2xl sm:right-3 sm:top-3 sm:h-20 sm:w-20 md:h-24 md:w-24">
                          <div className="font-display text-sm font-extrabold leading-none sm:text-base md:text-lg">
                            {content.seal.line1}
                          </div>
                          <div className="font-bn mt-0.5 whitespace-pre-line text-[7px] font-bold leading-tight sm:text-[8px] md:text-[10px]">
                            {content.seal.line2}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom curved wave */}
                  <svg
                    viewBox="0 0 1440 80"
                    preserveAspectRatio="none"
                    className="absolute inset-x-0 bottom-0 z-0 h-12 w-full sm:h-16"
                    aria-hidden
                  >
                    <path
                      d="M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,50 L1440,80 L0,80 Z"
                      fill={palette.wave}
                      fillOpacity="0.85"
                    />
                    <path
                      d="M0,55 C240,15 480,80 720,50 C960,20 1200,70 1440,35 L1440,80 L0,80 Z"
                      fill={palette.wave}
                    />
                  </svg>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
      <style>{`
        .hero-swiper .swiper-pagination {
          bottom: 16px !important;
        }
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.6);
          opacity: 1;
          width: 24px;
          height: 4px;
          border-radius: 9999px;
          transition: all 0.2s;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: white;
          width: 40px;
        }
      `}</style>
    </section>
  );
}
