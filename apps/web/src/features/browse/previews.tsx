import type { Merchant, Product } from '../../core/domain/catalog';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { BrowseView } from './presentation/BrowseView';
import type { BrowseData } from './presentation/useBrowseViewModel';

const noop = () => {};
const merchant: Merchant = { id: 'm', slug: 'b', name: 'Sawa Studio', bio: { en: 'Bio', ar: 'نبذة' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 0 };
const product: Product = { id: 'p', merchantId: 'm', categoryId: 'c', name: { en: 'Black jacket', ar: 'جاكيت أسود' }, description: { en: 'd', ar: 'د' }, visualDescription: 'v', gender: 'UNISEX', status: 'ACTIVE', pricePiasters: 45_000, images: [], variants: [] };
const view = (state: Loadable<BrowseData>, visible: readonly Product[] = []) => (
  <BrowseView state={state} categoryId={null} visible={visible} hasMore={false} onRetry={noop} onSelectCategory={noop} onShowMore={noop} onOpenBrand={noop} onOpenProduct={noop} />
);

export const previews: ScreenPreviews = {
  screen: 'Browse',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'No products yet', element: view({ kind: 'loaded', value: { merchants: [], categories: [], products: [] } }) },
    { name: 'Brands and products', element: view({ kind: 'loaded', value: { merchants: [merchant], categories: [], products: [product] } }, [product]) },
  ],
};
