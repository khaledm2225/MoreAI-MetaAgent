import type { Order } from '../../core/domain/order';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { OrdersView } from './presentation/OrdersView';

const noop = () => {};
const order = (id: string, status: Order['status']) => ({ id, orderNumber: `M${id}`, merchantName: 'Sawa Studio', status, items: [{ quantity: 2 }], totalPiasters: 95_000, placedAt: new Date('2026-11-04T20:00:00+02:00') }) as unknown as Order;
const view = (state: Loadable<readonly Order[]>) => <OrdersView state={state} onRetry={noop} onOpenOrder={noop} onOpenChat={noop} />;
const loaded = (value: readonly Order[]): Loadable<readonly Order[]> => ({ kind: 'loaded', value });

export const previews: ScreenPreviews = {
  screen: 'Orders list',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Empty', element: view(loaded([])) },
    { name: 'Active and past', element: view(loaded([order('1', 'ACCEPTED'), order('2', 'DELIVERED')])) },
  ],
};
