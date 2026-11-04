import type { Merchant, Product } from '../../core/domain/catalog';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { BrandView } from './presentation/BrandView';
import type { BrandData } from './presentation/useBrandViewModel';

const noop = () => {};
const merchant: Merchant = { id: 'm', slug: 'b', name: 'Sawa Studio', bio: { en: 'A made up local brand for this demo.', ar: 'براند محلي تجريبي.' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 0 };
const product: Product = { id: 'p', merchantId: 'm', categoryId: 'c', name: { en: 'Black jacket', ar: 'جاكيت أسود' }, description: { en: 'd', ar: 'د' }, visualDescription: 'v', gender: 'UNISEX', status: 'ACTIVE', pricePiasters: 45_000, images: [], variants: [] };
const view = (state: Loadable<BrandData>, isFollowing = false) => (
  <BrandView state={state} isFollowing={isFollowing} onRetry={noop} onToggleFollow={noop} onOpenProduct={noop} />
);
const loaded = (products: readonly Product[]): Loadable<BrandData> => ({ kind: 'loaded', value: { merchant, products, isFollowing: false } });

export const previews: ScreenPreviews = {
  screen: 'Brand page',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Products, follow', element: view(loaded([product])) },
    { name: 'Following', element: view(loaded([product]), true) },
    { name: 'No products', element: view(loaded([])) },
  ],
};
