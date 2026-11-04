import { useCallback, useState } from 'react';
import type { Id } from '../../../core/domain/catalog';
import type { OrdersRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export type SubmitState = 'idle' | 'sending' | 'failed';

export function useRateOrderViewModel(orderId: Id, orders: Pick<OrdersRepository, 'getOrder' | 'rateOrder'>) {
  const { state, reload, refresh } = useLoadable(() => orders.getOrder(orderId), [orderId, orders]);
  const [submit, setSubmit] = useState<SubmitState>('idle');

  const send = useCallback(
    (stars: number, comment: string) => {
      setSubmit('sending');
      orders.rateOrder(orderId, { stars, comment: comment.trim() }).then(
        () => {
          setSubmit('idle');
          refresh();
        },
        () => setSubmit('failed'),
      );
    },
    [orders, orderId, refresh],
  );

  return { state, reload, submit, send };
}
