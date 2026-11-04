import { useCallback, useEffect, useState } from 'react';
import type { Id } from '../../../core/domain/catalog';
import type { OrderStatus } from '../../../core/domain/order';
import type { MerchantOrdersRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export type OrdersTab = 'new' | 'inProgress' | 'finished';

export const tabOf = (status: OrderStatus): OrdersTab => {
  if (status === 'PLACED') {
    return 'new';
  }
  return status === 'ACCEPTED' || status === 'OUT_FOR_DELIVERY' ? 'inProgress' : 'finished';
};

export function useMerchantOrdersViewModel(orders: MerchantOrdersRepository) {
  const { state, reload, refresh } = useLoadable(() => orders.list(), [orders]);
  const [tab, setTab] = useState<OrdersTab>('new');
  const [rejecting, setRejecting] = useState<Id | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => orders.subscribe(refresh), [orders, refresh]);

  const move = useCallback(
    (orderId: Id, status: OrderStatus) => {
      setSaveFailed(false);
      setRejecting(null);
      orders.moveOrder(orderId, status).catch(() => setSaveFailed(true));
    },
    [orders],
  );

  return { state, reload, tab, setTab, rejecting, askToReject: setRejecting, keepOrder: useCallback(() => setRejecting(null), []), saveFailed, move };
}
