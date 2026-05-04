import { Helmet } from 'react-helmet-async';
import { useOrderStore } from '../../stores/orderStore';
import { formatBDT, formatDate } from '../../lib/utils';

export function AdminCustomers() {
  const orders = useOrderStore((s) => s.orders);
  const grouped: Record<string, { name: string; phone: string; orders: number; total: number; lastOrder: number; address?: string }> = {};
  for (const o of orders) {
    const key = o.customer.phone;
    if (!grouped[key]) grouped[key] = { name: o.customer.name, phone: o.customer.phone, orders: 0, total: 0, lastOrder: 0, address: o.customer.address };
    grouped[key].orders += 1;
    grouped[key].total += o.total;
    grouped[key].lastOrder = Math.max(grouped[key].lastOrder, o.createdAt);
  }
  const list = Object.values(grouped).sort((a, b) => b.lastOrder - a.lastOrder);

  return (
    <>
      <Helmet><title>Customers — Admin</title></Helmet>
      <h1 className="heading text-2xl font-extrabold">Customers</h1>
      <p className="text-sm text-slate-500">{list.length} total</p>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200/70 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Last order</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.phone} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3"><div className="font-medium">{c.name}</div><div className="text-xs text-slate-500">{c.address}</div></td>
                  <td className="px-4 py-3 text-xs">{c.phone}</td>
                  <td className="px-4 py-3"><span className="badge-brand">{c.orders}</span></td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(c.total)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(c.lastOrder)}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
