import type { MerchantDashboard } from '../../core/domain/merchant';
import type { Order } from '../../core/domain/order';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { MerchantDashboardView } from './presentation/MerchantDashboardView';

const noop = () => {};
const merchant = { id: 'm', slug: 'b', name: 'Sawa Studio', bio: { en: 'b', ar: 'ب' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 0 } as const;
const order = { id: 'o', orderNumber: 'M1000', status: 'PLACED', totalPiasters: 50_000 } as Order;
const loaded = (ordersSoFar: number, ordersToday: readonly Order[]): Loadable<MerchantDashboard> => ({ kind: 'loaded', value: { merchant, ordersSoFar, ordersToday } });
const view = (state: Loadable<MerchantDashboard>) => <MerchantDashboardView state={state} onRetry={noop} onOpenOrders={noop} onAddProduct={noop} />;

export const previews: ScreenPreviews = {
  screen: 'Merchant dashboard',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'No orders yet', element: view(loaded(0, [])) },
    { name: 'Progress and today’s orders', element: view(loaded(37, [order])) },
  ],
};
