import type { Id } from '../../../core/domain/catalog';
import type { OrdersRepository } from '../../../core/domain/ports';
import { RateOrderView } from './RateOrderView';
import { useRateOrderViewModel } from './useRateOrderViewModel';

export interface RateOrderScreenProps {
  readonly orderId: Id;
  readonly orders: Pick<OrdersRepository, 'getOrder' | 'rateOrder'>;
  readonly onBack: () => void;
}

export function RateOrderScreen({ orderId, orders, onBack }: RateOrderScreenProps) {
  const { state, reload, submit, send } = useRateOrderViewModel(orderId, orders);
  return <RateOrderView state={state} submit={submit} onRetry={reload} onSend={send} onBack={onBack} />;
}
