import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { FaFacebookMessenger, FaWhatsapp } from 'react-icons/fa';
import { Logo } from '../ui/Logo';
import { callLink, messengerLink, whatsappLink } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';

export function Footer() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const tagline = t('footer.tagline', settings.brandTagline);

  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-gradient-to-b from-white/80 to-brand-50/40 backdrop-blur dark:border-white/10 dark:from-slate-950/80 dark:to-slate-950/60">
      <div className="section grid gap-10 py-14 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">{tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Facebook"
              >
                <FiFacebook className="h-4 w-4" />
              </a>
            )}
            {settings.messengerUrl && (
              <a
                href={messengerLink(settings.messengerUrl)}
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Messenger"
              >
                <FaFacebookMessenger className="h-4 w-4" />
              </a>
            )}
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <FiInstagram className="h-4 w-4" />
              </a>
            )}
            <a
              href={whatsappLink('Hello! I have a question about Ahmad Collection products.', settings.whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="social-icon"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="h-4 w-4" />
            </a>
            <a
              href={callLink(settings.contactPhone)}
              className="social-icon"
              aria-label="Call"
            >
              <FiPhone className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            {t('footer.shop', 'Shop')}
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/shop" className="transition hover:text-brand-600 dark:hover:text-brand-300">{t('footer.allProducts', 'All Products')}</Link></li>
            <li><Link to="/shop?cat=mustard-oil" className="transition hover:text-brand-600 dark:hover:text-brand-300">Mustard Oil</Link></li>
            <li><Link to="/shop?cat=honey" className="transition hover:text-brand-600 dark:hover:text-brand-300">Honey</Link></li>
            <li><Link to="/shop?cat=ghee" className="transition hover:text-brand-600 dark:hover:text-brand-300">Ghee</Link></li>
            <li><Link to="/shop?cat=khejur-gur" className="transition hover:text-brand-600 dark:hover:text-brand-300">Khejur Gur</Link></li>
            <li><Link to="/shop?cat=dates" className="transition hover:text-brand-600 dark:hover:text-brand-300">Dates &amp; Attar</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            {t('footer.help', 'Help')}
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/track" className="transition hover:text-brand-600 dark:hover:text-brand-300">{t('footer.trackOrder', 'Track Order')}</Link></li>
            <li><Link to="/account" className="transition hover:text-brand-600 dark:hover:text-brand-300">{t('footer.myAccount', 'My Account')}</Link></li>
            <li><a href={whatsappLink('Hi, I need help with my order.', settings.whatsappNumber)} target="_blank" rel="noreferrer" className="transition hover:text-brand-600 dark:hover:text-brand-300">WhatsApp Support</a></li>
            <li><a href={callLink(settings.contactPhone)} className="transition hover:text-brand-600 dark:hover:text-brand-300">{t('footer.callUs', 'Call Us')}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            {t('footer.contact', 'Contact')}
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2"><FiPhone className="mt-0.5 h-4 w-4 flex-none text-brand-500" /><a className="transition hover:text-brand-600 dark:hover:text-brand-300" href={callLink(settings.contactPhone)}>{settings.contactPhoneDisplay || settings.contactPhone}</a></li>
            <li className="flex items-start gap-2"><FiMail className="mt-0.5 h-4 w-4 flex-none text-brand-500" /><a className="transition hover:text-brand-600 dark:hover:text-brand-300" href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a></li>
            <li className="flex items-start gap-2"><FiMapPin className="mt-0.5 h-4 w-4 flex-none text-brand-500" />Bangladesh — {t('footer.deliveryNote', 'delivery nationwide')}</li>
            <li className="text-xs text-slate-500">Sat–Thu • 10am–8pm</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200/70 dark:border-white/10">
        <div className="section flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} {settings.brandName}. {t('footer.rights', 'All rights reserved.')}</div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-pink-500/10 px-2.5 py-1 font-bold text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">bKash</span>
            <span className="rounded-lg bg-orange-500/10 px-2.5 py-1 font-bold text-orange-700 dark:bg-orange-500/20 dark:text-orange-200">Nagad</span>
            <span className="rounded-lg bg-slate-500/10 px-2.5 py-1 font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-200">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
