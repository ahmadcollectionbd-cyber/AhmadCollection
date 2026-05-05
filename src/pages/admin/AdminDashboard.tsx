import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiBox, FiHome, FiPackage, FiShoppingBag, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { useDataStore } from '../../stores/dataStore';
import { PageHeader } from '../../components/admin/PageHeader';
import { useOrderStore } from '../../stores/orderStore';
import { formatBDT, formatDate } from '../../lib/utils';

export function AdminDashboard() {
  const products = useDataStore((s) => s.products);
  const orders = useOrderStore((s) => s.orders);
  const totalRevenue = orders.filter((o) => o.status !== 'returned').reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 86400000;
    const total = orders
      .filter((o) => o.createdAt >= start && o.createdAt < end && o.status !== 'returned')
      .reduce((acc, o) => acc + o.total, 0);
    return { day: d.toLocaleDateString('en-BD', { weekday: 'short' }), date: formatDate(start), revenue: total };
  });

  const topProducts = (() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      for (const it of o.items) {
        if (!counts[it.productId]) counts[it.productId] = { name: it.name, qty: 0, revenue: 0 };
        counts[it.productId].qty += it.quantity;
        counts[it.productId].revenue += it.price * it.quantity;
      }
    }
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  })();

  return (
    <>
      <Helmet><title>Admin Dashboard — Ahmad Collection</title></Helmet>
      <div>
        <PageHeader
          icon={<FiHome />}
          title="Dashboard"
          subtitle="Welcome back. Here's a snapshot of your store."
          accent="brand"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<FiTrendingUp />} label="Revenue" value={formatBDT(totalRevenue)} accent="from-brand-500 to-brand-600" />
          <Stat icon={<FiShoppingBag />} label="Orders" value={`${totalOrders}`} accent="from-accent-500 to-accent-600" />
          <Stat icon={<FiPackage />} label="Pending" value={`${pendingOrders}`} accent="from-amber-500 to-amber-600" />
          <Stat icon={<FiBox />} label="Products" value={`${products.length}`} accent="from-sky-500 to-sky-600" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider">Revenue (last 7 days)</h2>
              <Link to="/admin/analytics" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
                View all <FiArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(100,116,139,0.2)" />
                  <XAxis dataKey="day" stroke="rgba(100,116,139,0.6)" fontSize={11} />
                  <YAxis stroke="rgba(100,116,139,0.6)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(0,0,0,0.06)' }}
                    formatter={(v) => [formatBDT(Number(v)), 'Revenue'] as [string, string]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#0e5132" strokeWidth={2.5} dot={{ fill: '#c81e1e', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">Top products</h2>
            {topProducts.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">No orders yet to rank products.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {topProducts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                    <div className="line-clamp-1 flex-1">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.qty}×</div>
                    <div className="text-xs font-bold">{formatBDT(p.revenue)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 card p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Orders by day</h2>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7.map((d) => ({ day: d.day, orders: orders.filter((o) => formatDate(o.createdAt) === d.date).length }))}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="day" stroke="rgba(100,116,139,0.6)" fontSize={11} />
                <YAxis stroke="rgba(100,116,139,0.6)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#c81e1e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl`} />
      <div className="flex items-center gap-3">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
          <div className="text-lg font-extrabold">{value}</div>
        </div>
      </div>
    </div>
  );
}
