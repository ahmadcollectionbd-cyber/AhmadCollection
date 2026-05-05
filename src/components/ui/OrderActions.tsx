import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiRotateCcw, FiXOctagon } from 'react-icons/fi';
import { useOrderStore } from '../../stores/orderStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { queueOrderNotification } from '../../lib/notifications';
import type { Order } from '../../types';

interface Props {
  order: Order;
  /** Render as a customer-side action panel; admin uses dedicated dropdown. */
  variant?: 'customer';
}

/** Customer-side actions: Cancel (pending/confirmed), Mark received, Request return. */
export function OrderActions({ order }: Props) {
  const { t } = useTranslation();
  const updateStatus = useOrderStore((s) => s.updateStatus);
  const settings = useSettingsStore((s) => s.settings);
  const [busy, setBusy] = useState(false);

  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canMarkReceived = order.status === 'on_the_way';
  const canReturn = order.status === 'delivered';

  if (!canCancel && !canMarkReceived && !canReturn) return null;

  async function run(label: 'cancelled' | 'delivered' | 'returned', successMsg: string) {
    setBusy(true);
    try {
      await updateStatus(order.id, label, label === 'cancelled' ? 'Cancelled by customer' : label === 'returned' ? 'Return requested by customer' : 'Marked received by customer');
      const refreshed = useOrderStore.getState().byId(order.id);
      if (refreshed) {
        await queueOrderNotification({
          type: label === 'cancelled' ? 'order.cancelled' : 'order.updated',
          order: refreshed,
          settings,
        });
      }
      toast.success(successMsg);
    } catch (e) {
      console.error(e);
      toast.error('Could not update — please try again');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {canCancel && (
        <button
          disabled={busy}
          onClick={() => run('cancelled', 'Order cancelled')}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
        >
          <FiXOctagon className="h-3.5 w-3.5" />
          {t('order.cancel')}
        </button>
      )}
      {canMarkReceived && (
        <button
          disabled={busy}
          onClick={() => run('delivered', 'Marked as received')}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          <FiCheck className="h-3.5 w-3.5" />
          {t('order.markReceived')}
        </button>
      )}
      {canReturn && (
        <button
          disabled={busy}
          onClick={() => run('returned', 'Return requested')}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <FiRotateCcw className="h-3.5 w-3.5" />
          {t('order.requestReturn')}
        </button>
      )}
    </div>
  );
}
