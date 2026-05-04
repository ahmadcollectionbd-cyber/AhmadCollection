import { useTranslation } from 'react-i18next';
import { FiCheck, FiClock, FiPackage, FiRotateCcw, FiTruck } from 'react-icons/fi';
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
      <div className="rounded-xl border border-accent-200 bg-accent-50 p-3 text-sm text-accent-700 dark:border-accent-500/30 dark:bg-accent-500/10 dark:text-accent-300">
        <FiRotateCcw className="mr-2 inline h-4 w-4" />
        {t('order.status.returned')}
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
