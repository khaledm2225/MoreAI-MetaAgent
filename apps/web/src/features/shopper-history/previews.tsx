import type { ShopperRecord } from '../../core/domain/merchant';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { ShopperHistoryView } from './presentation/ShopperHistoryView';

const noop = () => {};
const record = (overrides: Partial<ShopperRecord> = {}): ShopperRecord => ({ shopperId: 's', displayName: 'Salma K.', ordersPlaced: 6, ordersReceived: 2, ordersRefused: 4, merchantRating: null, isBlocked: false, ...overrides });
const view = (state: Loadable<readonly ShopperRecord[]>, stopping: string | null = null) => (
  <ShopperHistoryView state={state} stopping={stopping} saveFailed={false} onRetry={noop} onRate={noop} onAskToStop={noop} onKeepAccepting={noop} onSetBlocked={noop} />
);
const loaded = (value: readonly ShopperRecord[]): Loadable<readonly ShopperRecord[]> => ({ kind: 'loaded', value });

export const previews: ScreenPreviews = {
  screen: 'Shopper history',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Empty', element: view(loaded([])) },
    { name: 'Delivery record', element: view(loaded([record()])) },
    { name: 'Rate shopper', element: view(loaded([record({ merchantRating: 2 })])) },
    { name: 'Stop accepting orders', element: view(loaded([record()]), 's') },
    { name: 'Stopped', element: view(loaded([record({ isBlocked: true })])) },
  ],
};
