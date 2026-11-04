import type { Order, OrderStatus } from '../../core/domain/order';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { MerchantOrdersView } from './presentation/MerchantOrdersView';
import type { OrdersTab } from './presentation/useMerchantOrdersViewModel';

const noop = () => {};
const order = (status: OrderStatus) =>
  ({ id: status, orderNumber: 'M1000', merchantName: 'Sawa Studio', status, items: [{ id: 'i', productName: { en: 'Black jacket', ar: 'جاكيت أسود' }, sizeLabel: 'L', quantity: 1 }], totalPiasters: 50_000, address: { recipientName: 'Khaled', street: 'Road 9', area: 'Maadi' } }) as unknown as Order;
const view = (state: Loadable<readonly Order[]>, tab: OrdersTab = 'new', rejecting: string | null = null) => (
  <MerchantOrdersView state={state} tab={tab} rejecting={rejecting} saveFailed={false} onRetry={noop} onSelectTab={noop} onMove={noop} onAskToReject={noop} onKeepOrder={noop} />
);
const all: Loadable<readonly Order[]> = { kind: 'loaded', value: (['PLACED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED'] as const).map(order) };

export const previews: ScreenPreviews = {
  screen: 'Orders inbox',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Empty', element: view({ kind: 'loaded', value: [] }) },
    { name: 'New', element: view(all) },
    { name: 'Accepted and out for delivery', element: view(all, 'inProgress') },
    { name: 'Delivered and rejected', element: view(all, 'finished') },
    { name: 'Rejecting', element: view(all, 'new', 'PLACED') },
  ],
};
