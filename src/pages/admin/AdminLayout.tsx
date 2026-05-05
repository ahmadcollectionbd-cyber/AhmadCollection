import { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  FiBarChart2,
  FiBell,
  FiBox,
  FiGrid,
  FiHome,
  FiImage,
  FiMenu,
  FiPackage,
  FiSettings,
  FiTag,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { FirestoreStatusBanner } from '../../components/admin/FirestoreStatusBanner';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: <FiHome className="h-4 w-4" />, end: true },
  { to: '/admin/products', label: 'Products', icon: <FiBox className="h-4 w-4" /> },
  { to: '/admin/categories', label: 'Categories', icon: <FiGrid className="h-4 w-4" /> },
  { to: '/admin/banners', label: 'Banners', icon: <FiImage className="h-4 w-4" /> },
  { to: '/admin/orders', label: 'Orders', icon: <FiPackage className="h-4 w-4" /> },
  { to: '/admin/customers', label: 'Customers', icon: <FiUsers className="h-4 w-4" /> },
  { to: '/admin/coupons', label: 'Coupons', icon: <FiTag className="h-4 w-4" /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <FiBarChart2 className="h-4 w-4" /> },
  { to: '/admin/notifications', label: 'Notifications', icon: <FiBell className="h-4 w-4" /> },
  { to: '/admin/settings', label: 'Settings', icon: <FiSettings className="h-4 w-4" /> },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const [openMenu, setOpenMenu] = useState(false);
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="section py-16 text-center text-sm text-slate-500">Loading…</div>
    );
  }
  if (!user) {
    return (
      <div className="section py-16 text-center">
        <h1 className="heading text-2xl font-bold">Please sign in</h1>
        <p className="mt-2 text-sm text-slate-500">You must be signed in to access the admin panel.</p>
        <Link to="/login" className="btn-primary mt-4 inline-flex">Login</Link>
      </div>
    );
  }
  if (user.role !== 'admin') {
    return (
      <div className="section py-16 text-center">
        <h1 className="heading text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-sm text-slate-500">Your account does not have admin privileges.</p>
        <p className="mt-1 text-xs text-slate-400">UID: <span className="font-mono">{user.uid}</span></p>
        <Link to="/" className="btn-outline mt-4 inline-flex">Back to home</Link>
      </div>
    );
  }

  const activeLabel =
    NAV.slice()
      .reverse()
      .find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ?? 'Admin';

  return (
    <div className="section mt-4 lg:mt-8">
      {/* Mobile-only quick toolbar — hides the desktop sidebar but exposes the
          same nav as a slide-in drawer plus a "you-are-here" label. */}
      <div className="lg:hidden mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpenMenu(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
          aria-label="Open admin menu"
        >
          <FiMenu className="h-4 w-4" />
        </button>
        <div className="font-display text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          {activeLabel}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="card sticky top-24 hidden h-fit p-3 lg:block">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {n.icon}
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <FirestoreStatusBanner />
          <Outlet />
        </div>
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="h-full w-[80%] max-w-xs bg-white p-4 shadow-2xl dark:bg-slate-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold uppercase tracking-wider">
                  Admin
                </span>
                <button
                  onClick={() => setOpenMenu(false)}
                  className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close menu"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-4 flex flex-col gap-1">
                {NAV.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    onClick={() => setOpenMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                      }`
                    }
                  >
                    {n.icon}
                    {n.label}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
