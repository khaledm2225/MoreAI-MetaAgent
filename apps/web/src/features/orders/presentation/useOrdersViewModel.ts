import { useEffect } from 'react';
import type { OrdersRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export function useOrdersViewModel(orders: Pick<OrdersRepository, 'listOrders' | 'subscribe'>) {
  const { state, reload, refresh } = useLoadable(() => orders.listOrders(), [orders]);
  useEffect(() => orders.subscribe(refresh), [orders, refresh]);
  return { state, reload };
}
