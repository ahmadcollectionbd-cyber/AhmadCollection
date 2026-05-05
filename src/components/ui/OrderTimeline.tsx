import { useTranslation } from 'react-i18next';
import { FiCheck, FiClock, FiPackage, FiRotateCcw, FiTruck, FiXOctagon } from 'react-icons/fi';
import type { OrderStatus } from '../../types';

const ORDER: { key: OrderStatus; icon: React.ReactNode }[] = [
  { key: 'pending', icon: <FiClock className="h-4 w-4" /> },
  { key: 'confirmed', icon: <FiCheck className="h-4 w-4" /> },
  { key: 'on_the_way', icon: <FiTruck className="h-4 w-4" /> },
  { key: 'delivered', icon: <FiPackage className="h-4 w-4" /> },
];

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();

  if (status === 'returned') {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        <FiRotateCcw className="mr-2 inline h-4 w-4" />
        {t('order.status.returned')}
      </div>
    );
  }
  if (status === 'cancelled') {
    return (
      <div className="rounded-xl border border-accent-200 bg-accent-50 p-3 text-sm text-accent-700 dark:border-accent-500/30 dark:bg-accent-500/10 dark:text-accent-300">
        <FiXOctagon className="mr-2 inline h-4 w-4" />
        {t('order.status.cancelled')}
      </div>
    );
  }

  const currentIdx = ORDER.findIndex((s) => s.key === status);

  return (
    <ol className="relative grid grid-cols-4 gap-2">
      {ORDER.map((s, i) => {
        const reached = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <li key={s.key} className="relative flex flex-col items-center text-center">
            <div
              className={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                reached
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-slate-300 bg-white text-slate-400 dark:border-white/10 dark:bg-slate-900'
              } ${current ? 'ring-4 ring-brand-500/20' : ''}`}
            >
              {s.icon}
            </div>
            <span className={`mt-1.5 text-[11px] font-semibold ${reached ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
              {t(`order.status.${s.key}`)}
            </span>
            {i < ORDER.length - 1 && (
              <span
                className={`absolute left-[60%] right-[-40%] top-4 h-0.5 ${
                  i < currentIdx ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const tone: Record<OrderStatus, string> = {
    pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
    on_the_way: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    returned: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${tone[status]}`}>
      {t(`order.status.${status}`)}
    </span>
  );
}
