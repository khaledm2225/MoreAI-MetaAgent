import type { Product, ProductStatus } from '../../core/domain/catalog';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { MerchantProductsView } from './presentation/MerchantProductsView';

const noop = () => {};
const product = (status: ProductStatus): Product => ({ id: status, merchantId: 'm', categoryId: 'c', name: { en: 'Black oversized jacket', ar: 'جاكيت أسود واسع' }, description: { en: 'd', ar: 'د' }, visualDescription: 'v', gender: 'UNISEX', status, pricePiasters: 45_000, images: [], variants: [] });
const all = (['ACTIVE', 'DRAFT', 'HIDDEN', 'ARCHIVED'] as const).map(product);
const view = (state: Loadable<readonly Product[]>, status: ProductStatus = 'ACTIVE') => <MerchantProductsView state={state} status={status} saveFailed={false} onRetry={noop} onSelectStatus={noop} onMove={noop} onAdd={noop} />;

export const previews: ScreenPreviews = {
  screen: 'Merchant products',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Empty', element: view({ kind: 'loaded', value: [] }) },
    ...(['DRAFT', 'ACTIVE', 'HIDDEN', 'ARCHIVED'] as const).map((status) => ({ name: status, element: view({ kind: 'loaded', value: all }, status) })),
  ],
};
