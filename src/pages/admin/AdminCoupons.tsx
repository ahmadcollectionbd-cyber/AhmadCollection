import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiPlus, FiTag, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDataStore } from '../../stores/dataStore';
import { PageHeader } from '../../components/admin/PageHeader';

export function AdminCoupons() {
  const coupons = useDataStore((s) => s.coupons);
  const addCoupon = useDataStore((s) => s.addCoupon);
  const removeCoupon = useDataStore((s) => s.removeCoupon);
  const updateCoupon = useDataStore((s) => s.updateCoupon);

  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'flat'>('percent');
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(0);

  function add() {
    if (!code.trim()) return toast.error('Code required');
    addCoupon({
      id: `c-${Date.now()}`,
      code: code.toUpperCase().trim(),
      type,
      value,
      minOrder: minOrder || undefined,
      active: true,
    });
    toast.success('Coupon created');
    setCode('');
    setValue(10);
    setMinOrder(0);
  }

  return (
    <>
      <Helmet><title>Coupons — Admin</title></Helmet>
      <PageHeader
        icon={<FiTag />}
        title="Coupons"
        subtitle={`${coupons.length} active`}
        accent="violet"
      />

      <div className="card mt-4 p-4">
        <div className="grid gap-2 sm:grid-cols-5">
          <input className="input" placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <select className="input" value={type} onChange={(e) => setType(e.target.value as 'percent' | 'flat')}>
            <option value="percent">% off</option>
            <option value="flat">৳ off</option>
          </select>
          <input className="input" type="number" placeholder="Value" value={value} onChange={(e) => setValue(Number(e.target.value))} />
          <input className="input" type="number" placeholder="Min order (optional)" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} />
          <button onClick={add} className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c) => (
          <li key={c.id} className="card relative overflow-hidden p-4">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-brand opacity-20 blur-2xl" />
            <div className="font-mono text-lg font-bold">{c.code}</div>
            <div className="text-sm text-slate-500">
              {c.type === 'percent' ? `${c.value}% off` : `৳${c.value} off`}
              {c.minOrder ? ` · min ৳${c.minOrder}` : ''}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="inline-flex items-center gap-1 text-xs">
                <input type="checkbox" checked={c.active} onChange={(e) => updateCoupon(c.id, { active: e.target.checked })} />
                Active
              </label>
              <button
                onClick={() => {
                  if (confirm(`Delete coupon ${c.code}?`)) {
                    removeCoupon(c.id);
                    toast.success('Deleted');
                  }
                }}
                className="ml-auto rounded-lg p-1.5 text-accent-500 hover:bg-accent-500/10"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
