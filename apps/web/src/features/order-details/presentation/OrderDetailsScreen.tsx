import type { Id } from '../../../core/domain/catalog';
import type { OrdersRepository } from '../../../core/domain/ports';
import { OrderDetailsView } from './OrderDetailsView';
import { useOrderDetailsViewModel } from './useOrderDetailsViewModel';

export interface OrderDetailsScreenProps {
  readonly orderId: Id;
  readonly orders: Pick<OrdersRepository, 'getOrder' | 'subscribe'>;
  readonly onRate: (orderId: Id) => void;
}

export function OrderDetailsScreen({ orderId, orders, onRate }: OrderDetailsScreenProps) {
  const { state, reload } = useOrderDetailsViewModel(orderId, orders);
  return <OrderDetailsView state={state} onRetry={reload} onRate={() => onRate(orderId)} />;
}
