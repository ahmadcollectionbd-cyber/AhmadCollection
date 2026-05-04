import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiBell, FiHeart, FiLogOut, FiMenu, FiPackage, FiShoppingCart, FiUser, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LangToggle } from '../ui/LangToggle';
import { SearchBar } from '../ui/SearchBar';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.count());
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notifications = useDataStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;
  const markRead = useDataStore((s) => s.markNotificationsRead);
  const [openMenu, setOpenMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const navItem =
    'rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-300';
  const navActive = 'text-brand-600 dark:text-brand-300';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
      <div className="section flex h-16 items-center gap-3">
        <Logo />
        <nav className="ml-4 hidden lg:flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            {t('nav.shop')}
          </NavLink>
          <NavLink to="/track" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            {t('nav.track')}
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
              {t('nav.admin')}
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex flex-1 justify-center">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenNotif((v) => !v);
                if (unread) markRead();
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 backdrop-blur transition hover:border-brand-500/40 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-brand-300"
              aria-label="Notifications"
            >
              <FiBell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            <AnimatePresence>
              {openNotif && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-[110%] z-50 w-80 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95"
                >
                  <div className="border-b border-slate-200/70 px-4 py-2 text-sm font-semibold dark:border-white/10">
                    Notifications
                  </div>
                  <ul className="max-h-72 overflow-auto">
                    {notifications.length === 0 && (
                      <li className="px-4 py-6 text-center text-sm text-slate-500">No notifications</li>
                    )}
                    {notifications.map((n) => (
                      <li key={n.id} className="px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <div className="font-medium">{n.title}</div>
                        {n.body && <div className="text-xs text-slate-500">{n.body}</div>}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/wishlist"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 backdrop-blur transition hover:border-brand-500/40 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-brand-300"
            aria-label="Wishlist"
          >
            <FiHeart className="h-4 w-4" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 backdrop-blur transition hover:border-brand-500/40 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-brand-300"
            aria-label="Cart"
          >
            <FiShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to={user.role === 'admin' ? '/admin' : '/account'}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur hover:border-brand-500/40 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-brand-300"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <FiUser className="h-3.5 w-3.5" />
                )}
                <span className="max-w-[80px] truncate">{user.name}</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-500 hover:text-accent-500 dark:border-white/10 dark:bg-slate-900/60"
                aria-label="Logout"
              >
                <FiLogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:inline-flex btn-primary px-4 py-2 text-xs">
              {t('nav.login')}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpenMenu(true)}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
            aria-label="Open menu"
          >
            <FiMenu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="md:hidden border-t border-slate-200/70 px-4 py-2 dark:border-white/10">
        <SearchBar compact />
      </div>

      <AnimatePresence>
        {openMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpenMenu(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="ml-auto h-full w-[80%] max-w-sm bg-white p-6 shadow-2xl dark:bg-slate-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setOpenMenu(false)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-6 flex flex-col gap-1">
                <NavLink to="/" end onClick={() => setOpenMenu(false)} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : ''}`}>
                  {t('nav.home')}
                </NavLink>
                <NavLink to="/shop" onClick={() => setOpenMenu(false)} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : ''}`}>
                  {t('nav.shop')}
                </NavLink>
                <NavLink to="/track" onClick={() => setOpenMenu(false)} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : ''}`}>
                  {t('nav.track')}
                </NavLink>
                <NavLink to="/wishlist" onClick={() => setOpenMenu(false)} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : ''}`}>
                  <FiHeart className="mr-2 inline h-4 w-4" />
                  {t('nav.wishlist')}
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" onClick={() => setOpenMenu(false)} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : ''}`}>
                    <FiPackage className="mr-2 inline h-4 w-4" />
                    {t('nav.admin')}
                  </NavLink>
                )}
                <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-white/10">
                  {user ? (
                    <button
                      onClick={() => {
                        logout();
                        setOpenMenu(false);
                        navigate('/');
                      }}
                      className="btn-outline w-full"
                    >
                      <FiLogOut className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  ) : (
                    <Link to="/login" onClick={() => setOpenMenu(false)} className="btn-primary w-full">
                      {t('nav.login')}
                    </Link>
                  )}
                </div>
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
