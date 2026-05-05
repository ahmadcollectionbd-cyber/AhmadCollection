import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiLogOut, FiPackage, FiUser } from 'react-icons/fi';
import { useAuthStore } from '../stores/authStore';
import { useOrderStore } from '../stores/orderStore';
import { formatBDT, formatDateTime } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { OrderStatusBadge } from '../components/ui/OrderTimeline';
import { OrderActions } from '../components/ui/OrderActions';

export function Account() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const orders = useOrderStore((s) => s.orders);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="section py-16 text-center">
        <h1 className="heading text-2xl font-bold">Please login to view your account</h1>
        <Link to="/login" className="btn-primary mt-4 inline-flex">Login</Link>
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.userId === user!.uid);

  return (
    <>
      <Helmet><title>My Account — Ahmad Collection</title></Helmet>
      <section className="section mt-8">
        <div className="card flex items-center gap-4 p-5">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white">
            {user.photoURL ? <img src={user.photoURL} className="h-14 w-14 rounded-full object-cover" alt="" /> : <FiUser className="h-6 w-6" />}
          </div>
          <div>
            <div className="font-display text-lg font-bold">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="ml-auto btn-outline text-xs">
            <FiLogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
        </div>

        <div className="mt-8">
          <h2 className="heading text-xl font-extrabold">My Orders</h2>
          {myOrders.length === 0 ? (
            <div className="card mt-3 p-10 text-center text-sm text-slate-500">
              <FiPackage className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3">No orders yet.</p>
              <Link to="/shop" className="btn-primary mt-3 inline-flex">Start shopping</Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {myOrders.map((o) => (
                <li key={o.id} className="card p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <div className="font-mono text-sm font-bold">{o.shortId}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(o.createdAt)} · {o.items.length} items</div>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <div className="text-sm font-bold">{formatBDT(o.total)}</div>
                      <Link to={`/order/${o.shortId}`} className="btn-outline text-xs">View</Link>
                    </div>
                  </div>
                  <OrderActions order={o} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
