import { useEffect, useMemo, useState } from 'react';
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
import { useOrderStore } from '../../stores/orderStore';

interface NavEntry {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavEntry[];
}

/**
 * Two-tiered admin navigation. Top group is the "operate the business"
 * pages — what an admin opens 50× a day. Bottom group is "configure the
 * business" — touched once per change. Splitting them visually makes the
 * sidebar much easier to scan and matches the grouping the customer
 * specifically asked for.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operate',
    items: [
      { to: '/admin', label: 'Dashboard', icon: <FiHome className="h-4 w-4" />, end: true },
      { to: '/admin/orders', label: 'Orders', icon: <FiPackage className="h-4 w-4" /> },
      { to: '/admin/customers', label: 'Customers', icon: <FiUsers className="h-4 w-4" /> },
      { to: '/admin/analytics', label: 'Analytics', icon: <FiBarChart2 className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Configure',
    items: [
      { to: '/admin/products', label: 'Products', icon: <FiBox className="h-4 w-4" /> },
      { to: '/admin/categories', label: 'Categories', icon: <FiGrid className="h-4 w-4" /> },
      { to: '/admin/banners', label: 'Banners', icon: <FiImage className="h-4 w-4" /> },
      { to: '/admin/coupons', label: 'Coupons', icon: <FiTag className="h-4 w-4" /> },
      { to: '/admin/notifications', label: 'Notifications', icon: <FiBell className="h-4 w-4" /> },
      { to: '/admin/settings', label: 'Settings', icon: <FiSettings className="h-4 w-4" /> },
    ],
  },
];

const FLAT_NAV: NavEntry[] = NAV_GROUPS.flatMap((g) => g.items);

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const orders = useOrderStore((s) => s.orders);
  const [openMenu, setOpenMenu] = useState(false);
  const location = useLocation();

  // Lock background scroll when the mobile drawer is open.
  useEffect(() => {
    if (!openMenu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openMenu]);

  // Drawer is closed by each NavLink's `onNavigate` handler so we don't need
  // a route-change effect; that path already runs a setState explicitly.

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    let pending = 0;
    let todayCount = 0;
    for (const o of orders) {
      if (o.status === 'pending') pending += 1;
      if (o.createdAt >= todayMs) todayCount += 1;
    }
    return { pending, todayCount };
  }, [orders]);

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
    FLAT_NAV.slice()
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

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="sticky top-24 hidden h-fit overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 lg:block">
          {/* Brand header */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Admin
            </div>
            <div className="mt-0.5 truncate font-display text-lg font-bold">
              {user.name || 'Admin'}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                {stats.todayCount} today
              </span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                {stats.pending} pending
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-3 p-3">
            {NAV_GROUPS.map((group) => (
              <NavGroupBlock key={group.label} group={group} />
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

      <AnimatePresence>
        {openMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpenMenu(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="flex h-full w-[85%] max-w-xs flex-col overflow-y-auto bg-white shadow-2xl dark:bg-slate-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold uppercase tracking-wider">
                    Admin
                  </span>
                  <button
                    onClick={() => setOpenMenu(false)}
                    className="rounded-lg p-1.5 hover:bg-white/10"
                    aria-label="Close menu"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-white/15 px-2 py-0.5">
                    {stats.todayCount} today
                  </span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5">
                    {stats.pending} pending
                  </span>
                </div>
              </div>
              <nav className="flex flex-col gap-3 p-3">
                {NAV_GROUPS.map((group) => (
                  <NavGroupBlock key={group.label} group={group} onNavigate={() => setOpenMenu(false)} />
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavGroupBlock({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  return (
    <div>
      <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {group.label}
      </div>
      <div className="flex flex-col gap-1">
        {group.items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500/15 to-brand-500/5 text-brand-700 shadow-sm dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full bg-brand-500" style={{ width: 3 }} />
                )}
                <span className={isActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}>
                  {n.icon}
                </span>
                <span>{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
