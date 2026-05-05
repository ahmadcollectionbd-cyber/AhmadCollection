import { NavLink, useLocation } from 'react-router-dom';
import { FiHeart, FiHome, FiSearch, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';

interface Tab {
  to: string;
  label: string;
  icon: React.ReactNode;
  match?: (pathname: string) => boolean;
}

/**
 * Phone-only bottom navigation bar that gives the site a "real app" feel.
 * Hidden on `md+` since the desktop header already exposes the same nav.
 *
 * Tabs are sized for thumb-reach (h-16), use safe-area-inset on iOS so
 * they sit above the home indicator, and show live cart / wishlist
 * counts as red dot badges.
 */
export function MobileTabBar() {
  const cartCount = useCartStore((s) => s.count());
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const { pathname } = useLocation();

  // Don't render the bar on admin pages — the admin layout has its own
  // mobile drawer and the consumer tabs would be confusing there.
  if (pathname.startsWith('/admin')) return null;

  const tabs: (Tab & { badge?: number })[] = [
    {
      to: '/',
      label: 'Home',
      icon: <FiHome className="h-5 w-5" />,
      match: (p) => p === '/',
    },
    {
      to: '/shop',
      label: 'Shop',
      icon: <FiSearch className="h-5 w-5" />,
      match: (p) => p.startsWith('/shop') || p.startsWith('/product') || p.startsWith('/c/'),
    },
    {
      to: '/cart',
      label: 'Cart',
      icon: <FiShoppingBag className="h-5 w-5" />,
      match: (p) => p === '/cart' || p.startsWith('/checkout'),
      badge: cartCount,
    },
    {
      to: '/wishlist',
      label: 'Saved',
      icon: <FiHeart className="h-5 w-5" />,
      badge: wishlistCount,
    },
    {
      to: '/account',
      label: 'Me',
      icon: <FiUser className="h-5 w-5" />,
      match: (p) => p.startsWith('/account') || p.startsWith('/login') || p.startsWith('/register'),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-950/90 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <ul className="grid grid-cols-5">
        {tabs.map((t) => {
          const isActive = t.match ? t.match(pathname) : pathname === t.to;
          return (
            <li key={t.to}>
              <NavLink
                to={t.to}
                className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="relative">
                  {t.icon}
                  {typeof t.badge === 'number' && t.badge > 0 && (
                    <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {t.badge > 99 ? '99+' : t.badge}
                    </span>
                  )}
                </span>
                <span>{t.label}</span>
                {isActive && (
                  <span className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-brand-500" />
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
