import type { CartLine } from '../../core/domain/cart';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { CartView } from './presentation/CartView';

const noop = () => {};
const line = (overrides: Partial<CartLine> = {}): CartLine => ({ id: 'l', productId: 'p', variantId: 'v', merchantId: 'm', merchantName: 'Sawa Studio', productName: { en: 'Black jacket', ar: 'جاكيت أسود' }, colorName: { en: 'Black', ar: 'أسود' }, sizeLabel: 'L', imagePath: null, unitPricePiasters: 45_000, quantity: 1, availability: 'available', previousUnitPricePiasters: null, ...overrides });
const view = (state: Loadable<readonly CartLine[]>) => <CartView state={state} onRetry={noop} onSetQuantity={noop} onRemove={noop} onOpenChat={noop} onCheckout={noop} />;
const loaded = (value: readonly CartLine[]): Loadable<readonly CartLine[]> => ({ kind: 'loaded', value });

export const previews: ScreenPreviews = {
  screen: 'Cart',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Empty', element: view(loaded([])) },
    { name: 'Items grouped by brand', element: view(loaded([line({ id: '1' }), line({ id: '2', merchantId: 'n', merchantName: 'Noon Label', productName: { en: 'Olive hoodie', ar: 'هودي زيتي' } })])) },
    { name: 'Piece sold out', element: view(loaded([line({ availability: 'soldOut' })])) },
    { name: 'Price changed', element: view(loaded([line({ previousUnitPricePiasters: 40_000 })])) },
  ],
};
