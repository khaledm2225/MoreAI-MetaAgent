import type { Order } from '../../core/domain/order';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { RateOrderView } from './presentation/RateOrderView';

const noop = () => {};
const order = (status: Order['status'], rating: Order['rating'] = null) => ({ id: 'o', merchantName: 'Sawa Studio', status, rating }) as Order;
const view = (state: Loadable<Order | null>) => <RateOrderView state={state} submit="idle" onRetry={noop} onSend={noop} onBack={noop} />;

export const previews: ScreenPreviews = {
  screen: 'Rate an order',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Not available until delivered', element: view({ kind: 'loaded', value: order('ACCEPTED') }) },
    { name: 'Rating form', element: view({ kind: 'loaded', value: order('DELIVERED') }) },
    { name: 'Already rated', element: view({ kind: 'loaded', value: order('DELIVERED', { stars: 5, comment: '' }) }) },
  ],
};
