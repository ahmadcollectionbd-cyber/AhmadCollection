import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Pie, PieChart, Legend } from 'recharts';
import { FiBarChart2 } from 'react-icons/fi';
import { useOrderStore } from '../../stores/orderStore';
import { formatBDT } from '../../lib/utils';
import { PageHeader } from '../../components/admin/PageHeader';

const COLORS = ['#0e5132', '#c81e1e', '#f59e0b', '#0ea5e9', '#8b5cf6'];

export function AdminAnalytics() {
  const orders = useOrderStore((s) => s.orders);

  const monthly = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + (o.status !== 'returned' ? o.total : 0);
    }
    return Object.entries(map)
      .sort()
      .map(([k, v]) => ({ month: k, revenue: v }));
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) map[o.status] = (map[o.status] || 0) + 1;
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const totalRevenue = orders.filter((o) => o.status !== 'returned').reduce((acc, o) => acc + o.total, 0);
  const avgOrder = orders.length ? totalRevenue / orders.length : 0;

  return (
    <>
      <Helmet><title>Analytics — Admin</title></Helmet>
      <PageHeader
        icon={<FiBarChart2 />}
        title="Analytics"
        subtitle="Revenue, orders and category share at a glance."
        accent="violet"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total revenue" value={formatBDT(totalRevenue)} />
        <Stat label="Avg order value" value={formatBDT(Math.round(avgOrder))} />
        <Stat label="Total orders" value={`${orders.length}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Revenue by month</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0e5132" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#0e5132" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="month" stroke="rgba(100,116,139,0.6)" fontSize={11} />
                <YAxis stroke="rgba(100,116,139,0.6)" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => [formatBDT(Number(v)), 'Revenue'] as [string, string]} />
                <Area type="monotone" dataKey="revenue" stroke="#0e5132" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Order status</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" outerRadius={80} innerRadius={42} paddingAngle={3}>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
