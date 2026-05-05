import { NavLink, Outlet } from 'react-router-dom';
import { FiBarChart2, FiBox, FiGrid, FiHome, FiImage, FiPackage, FiSettings, FiTag, FiUsers } from 'react-icons/fi';
import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
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
  { to: '/admin/settings', label: 'Settings', icon: <FiSettings className="h-4 w-4" /> },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
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

  return (
    <div className="section mt-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="card sticky top-24 h-fit p-3">
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
    </div>
  );
}
