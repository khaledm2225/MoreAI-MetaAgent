import type { Order, OrderStatus } from '../../core/domain/order';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { OrderDetailsView } from './presentation/OrderDetailsView';

const noop = () => {};
const order = (status: OrderStatus): Order => ({
  id: 'o',
  orderNumber: 'M1000',
  merchantId: 'm',
  merchantName: 'Sawa Studio',
  status,
  items: [{ id: 'i', productId: 'p', variantId: 'v', productName: { en: 'Black jacket', ar: 'جاكيت أسود' }, colorName: { en: 'Black', ar: 'أسود' }, sizeLabel: 'L', imagePath: null, unitPricePiasters: 45_000, quantity: 1, lineTotalPiasters: 45_000 }],
  subtotalPiasters: 45_000,
  deliveryFeePiasters: 5_000,
  totalPiasters: 50_000,
  address: { recipientName: 'Khaled', mobile: '01012345678', area: 'Maadi', street: 'Road 9', building: '12', floor: '', apartment: '', landmark: '', notes: '' },
  placedAt: new Date('2026-11-04T20:00:00+02:00'),
  rating: null,
});
const view = (state: Loadable<Order | null>) => <OrderDetailsView state={state} onRetry={noop} onRate={noop} />;
const statuses: readonly OrderStatus[] = ['PLACED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED', 'NOT_DELIVERED'];

export const previews: ScreenPreviews = {
  screen: 'Order details',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    ...statuses.map((status) => ({ name: status, element: view({ kind: 'loaded', value: order(status) }) })),
  ],
};
