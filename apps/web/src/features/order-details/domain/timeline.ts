import type { OrderStatus } from '../../../core/domain/order';

export type OrderStepState = 'done' | 'current' | 'upcoming' | 'failed';

export interface OrderStep {
  readonly status: OrderStatus;
  readonly state: OrderStepState;
}

const HAPPY_PATH: readonly OrderStatus[] = ['PLACED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

/** Where the steps of an order stood when it ended badly, so the timeline shows how far it got. */
const LAST_GOOD_STEP: Readonly<Partial<Record<OrderStatus, number>>> = {
  REJECTED: 0,
  CANCELLED: 0,
  NOT_DELIVERED: 2,
};

export function orderTimeline(status: OrderStatus): readonly OrderStep[] {
  const lastGood = LAST_GOOD_STEP[status];
  if (lastGood !== undefined) {
    return [
      ...HAPPY_PATH.slice(0, lastGood + 1).map((step) => ({ status: step, state: 'done' as const })),
      { status, state: 'failed' as const },
    ];
  }
  const current = HAPPY_PATH.indexOf(status);
  return HAPPY_PATH.map((step, index) => ({
    status: step,
    state: index < current ? 'done' : index === current ? (status === 'DELIVERED' ? 'done' : 'current') : 'upcoming',
  }));
}
