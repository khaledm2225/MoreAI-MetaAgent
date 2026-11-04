import type { Address, Order } from '../../core/domain/order';
import type { ScreenPreviews } from '../../core/presentation/preview';
import { CheckoutView } from './presentation/CheckoutView';
import type { CheckoutState } from './presentation/useCheckoutViewModel';

const noop = () => {};
const address = {} as Address;
const summary = { orderCount: 2, subtotalPiasters: 95_000, deliveryPiasters: 10_000 };
const order = { id: 'o', orderNumber: 'M1000', merchantName: 'Sawa Studio', totalPiasters: 50_000 } as Order;
const view = (state: CheckoutState) => <CheckoutView state={state} onReview={noop} onCancel={noop} onPlace={noop} onOpenOrders={noop} onOpenCart={noop} />;

export const previews: ScreenPreviews = {
  screen: 'Checkout',
  states: [
    { name: 'Address form', element: view({ kind: 'address', hasFailed: false }) },
    { name: 'Error', element: view({ kind: 'address', hasFailed: true }) },
    { name: 'Loading', element: view({ kind: 'loadingSummary' }) },
    { name: 'Confirm dialog', element: view({ kind: 'confirming', address, summary }) },
    { name: 'Placing', element: view({ kind: 'placing', address, summary }) },
    { name: 'Placed with confetti', element: view({ kind: 'placed', orders: [order] }) },
    { name: 'Daily limit reached', element: view({ kind: 'dailyLimit', reason: 'SHOPPER_DAILY_LIMIT' }) },
    { name: 'Blocked by a brand', element: view({ kind: 'blocked' }) },
  ],
};
