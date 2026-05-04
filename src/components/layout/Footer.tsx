import { Link } from 'react-router-dom';
import { FiFacebook, FiPhone } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Logo } from '../ui/Logo';
import { CONTACT_PHONE_DISPLAY, FACEBOOK_URL, callLink, whatsappLink } from '../../lib/utils';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
      <div className="section grid gap-10 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-slate-600 dark:text-slate-400">
            Premium natural products — mustard oil, honey, ghee, and more — delivered fresh
            across Bangladesh.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              aria-label="Facebook"
            >
              <FiFacebook className="h-4 w-4" />
            </a>
            <a
              href={whatsappLink('Hello! I have a question about Ahmad Collection products.')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="h-4 w-4" />
            </a>
            <a
              href={callLink()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              aria-label="Call"
            >
              <FiPhone className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Shop
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/shop" className="hover:text-brand-600">All Products</Link></li>
            <li><Link to="/shop?cat=mustard-oil" className="hover:text-brand-600">Mustard Oil</Link></li>
            <li><Link to="/shop?cat=honey" className="hover:text-brand-600">Honey</Link></li>
            <li><Link to="/shop?cat=ghee" className="hover:text-brand-600">Ghee</Link></li>
            <li><Link to="/shop?cat=spices" className="hover:text-brand-600">Spices</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Help
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/track" className="hover:text-brand-600">Track Order</Link></li>
            <li><a href={whatsappLink('Hi, I need help with my order.')} target="_blank" rel="noreferrer" className="hover:text-brand-600">WhatsApp Support</a></li>
            <li><a href={callLink()} className="hover:text-brand-600">Call Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Contact
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>Phone: <a className="hover:text-brand-600" href={callLink()}>{CONTACT_PHONE_DISPLAY}</a></li>
            <li>Bangladesh — delivery nationwide</li>
            <li>Mon–Sat • 10am–8pm</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-500 dark:border-white/10">
        © {new Date().getFullYear()} Ahmad Collection. All rights reserved.
      </div>
    </footer>
  );
}
