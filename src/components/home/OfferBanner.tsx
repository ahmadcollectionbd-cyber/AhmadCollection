import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiTruck, FiShield, FiPercent, FiArrowRight } from 'react-icons/fi';

export function OfferBanner() {
  const { t } = useTranslation();
  return (
    <section className="section mt-14">
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/shop"
            className="group relative flex min-h-[180px] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-7 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/20 sm:min-h-[200px]"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-125" />
            <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-white/5" />
            <div className="relative z-10 flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                <FiTruck className="h-3 w-3" /> Free delivery
              </span>
              <h3 className="mt-4 text-xl font-extrabold leading-tight sm:text-2xl">
                {t('home.offerBannerTitle', 'Get up to 50% off')}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-white/70">
                {t('home.offerBannerSubtitle', 'Fast and free delivery')}
              </p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-white/90 transition group-hover:gap-2.5">
                Shop now <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <div className="ml-auto flex items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24">
                <FiPercent className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link
            to="/shop"
            className="group relative flex min-h-[180px] overflow-hidden rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 p-7 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/20 sm:min-h-[200px]"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-125" />
            <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-white/5" />
            <div className="relative z-10 flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                <FiShield className="h-3 w-3" /> Quality Promise
              </span>
              <h3 className="mt-4 text-xl font-extrabold leading-tight sm:text-2xl">
                100% Pure Products
              </h3>
              <p className="mt-2 max-w-xs text-sm text-white/70">
                Verified quality, no compromise
              </p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-white/90 transition group-hover:gap-2.5">
                Explore <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <div className="ml-auto flex items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24">
                <FiShield className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
