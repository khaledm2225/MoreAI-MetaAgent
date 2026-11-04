import { useEffect } from 'react';
import type { Id } from '../../../core/domain/catalog';
import type { OrdersRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export function useOrderDetailsViewModel(orderId: Id, orders: Pick<OrdersRepository, 'getOrder' | 'subscribe'>) {
  const { state, reload, refresh } = useLoadable(() => orders.getOrder(orderId), [orderId, orders]);
  // A status a brand sets shows up here live.
  useEffect(() => orders.subscribe(refresh), [orders, refresh]);
  return { state, reload };
}
