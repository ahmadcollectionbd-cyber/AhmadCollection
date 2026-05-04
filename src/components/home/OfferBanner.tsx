import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiArrowRight, FiTruck, FiShield, FiCreditCard } from 'react-icons/fi';

export function OfferBanner() {
  const { t } = useTranslation();
  return (
    <section className="section mt-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-brand p-8 text-white shadow-glow-brand sm:p-12 dark:border-white/10"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              Limited Time
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              {t('home.offerBannerTitle')}
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{t('home.offerBannerSubtitle')}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-slate-100">
                {t('home.cta')}
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/track" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20">
                Track Order
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            <Feature icon={<FiTruck className="h-5 w-5" />} title="Free Delivery" desc="On orders above ৳1500" />
            <Feature icon={<FiShield className="h-5 w-5" />} title="100% Pure" desc="Verified quality, no compromise" />
            <Feature icon={<FiCreditCard className="h-5 w-5" />} title="Easy Payments" desc="bKash, Nagad & COD" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">{icon}</div>
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-white/75">{desc}</div>
      </div>
    </div>
  );
}
