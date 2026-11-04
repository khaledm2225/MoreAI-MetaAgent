import type { Id } from '../../../core/domain/catalog';
import type { OrdersRepository } from '../../../core/domain/ports';
import { OrdersView } from './OrdersView';
import { useOrdersViewModel } from './useOrdersViewModel';

export interface OrdersScreenProps {
  readonly orders: Pick<OrdersRepository, 'listOrders' | 'subscribe'>;
  readonly onOpenOrder: (id: Id) => void;
  readonly onOpenChat: () => void;
}

export function OrdersScreen({ orders, onOpenOrder, onOpenChat }: OrdersScreenProps) {
  const { state, reload } = useOrdersViewModel(orders);
  return <OrdersView state={state} onRetry={reload} onOpenOrder={onOpenOrder} onOpenChat={onOpenChat} />;
}
