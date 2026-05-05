import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiTruck, FiShield, FiPercent } from 'react-icons/fi';

export function OfferBanner() {
  const { t } = useTranslation();
  return (
    <section className="section mt-12">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card 1 - Delivery offer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/shop"
            className="group relative flex min-h-[160px] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white transition hover:shadow-xl sm:min-h-[180px]"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative z-10 flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                <FiTruck className="h-3 w-3" /> Free delivery
              </span>
              <h3 className="mt-3 text-lg font-extrabold leading-tight sm:text-xl">
                {t('home.offerBannerTitle', 'Get up to 50% off')}
              </h3>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">
                {t('home.offerBannerSubtitle', 'Fast and free delivery')}
              </p>
            </div>
            <div className="ml-auto flex items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur-sm sm:h-20 sm:w-20">
                <FiPercent className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Card 2 - Quality promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link
            to="/shop"
            className="group relative flex min-h-[160px] overflow-hidden rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 p-6 text-white transition hover:shadow-xl sm:min-h-[180px]"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative z-10 flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                <FiShield className="h-3 w-3" /> Quality Promise
              </span>
              <h3 className="mt-3 text-lg font-extrabold leading-tight sm:text-xl">
                100% Pure Products
              </h3>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">
                Verified quality, no compromise
              </p>
            </div>
            <div className="ml-auto flex items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur-sm sm:h-20 sm:w-20">
                <FiShield className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
