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
    <footer className="mt-16 bg-brand-500 text-white dark:bg-slate-950">
      <div className="section grid gap-10 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-white/70">{tagline}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Instagram"
              >
                <FiInstagram className="h-4 w-4" />
              </a>
            )}
            <a
              href={whatsappLink('Hello! I have a question about Ahmad Collection products.', settings.whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="h-4 w-4" />
            </a>
            <a
              href={callLink(settings.contactPhone)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Call"
            >
              <FiPhone className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
            {t('footer.shop', 'Shop')}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/60">
            <li><Link to="/shop" className="hover:text-white">{t('footer.allProducts', 'All Products')}</Link></li>
            <li><Link to="/shop?cat=mustard-oil" className="hover:text-white">Mustard Oil</Link></li>
            <li><Link to="/shop?cat=honey" className="hover:text-white">Honey</Link></li>
            <li><Link to="/shop?cat=ghee" className="hover:text-white">Ghee</Link></li>
            <li><Link to="/shop?cat=spices" className="hover:text-white">Spices</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
            {t('footer.help', 'Help')}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/60">
            <li><Link to="/track" className="hover:text-white">{t('footer.trackOrder', 'Track Order')}</Link></li>
            <li><Link to="/account" className="hover:text-white">{t('footer.myAccount', 'My Account')}</Link></li>
            <li><a href={whatsappLink('Hi, I need help with my order.', settings.whatsappNumber)} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp Support</a></li>
            <li><a href={callLink(settings.contactPhone)} className="hover:text-white">{t('footer.callUs', 'Call Us')}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
            {t('footer.contact', 'Contact')}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/60">
            <li className="flex items-start gap-2"><FiPhone className="mt-0.5 h-4 w-4 flex-none text-white/40" /><a className="hover:text-white" href={callLink(settings.contactPhone)}>{settings.contactPhoneDisplay || settings.contactPhone}</a></li>
            <li className="flex items-start gap-2"><FiMail className="mt-0.5 h-4 w-4 flex-none text-white/40" /><a className="hover:text-white" href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a></li>
            <li className="flex items-start gap-2"><FiMapPin className="mt-0.5 h-4 w-4 flex-none text-white/40" />Bangladesh — {t('footer.deliveryNote', 'delivery nationwide')}</li>
            <li className="text-xs text-white/40">Sat–Thu • 10am–8pm</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-white/40">
          <div>© {new Date().getFullYear()} {settings.brandName}. {t('footer.rights', 'All rights reserved.')}</div>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-white/10 px-2 py-1 font-bold text-white/70">bKash</span>
            <span className="rounded-md bg-white/10 px-2 py-1 font-bold text-white/70">Nagad</span>
            <span className="rounded-md bg-white/10 px-2 py-1 font-bold text-white/70">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
