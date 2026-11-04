import type { ScreenPreviews } from '../../core/presentation/preview';
import { SearchView } from './presentation/SearchView';
import type { SearchState } from './presentation/useSearchViewModel';

const noop = () => {};
const view = (state: SearchState) => <SearchView state={state} onSearch={noop} onOpenProduct={noop} />;
const merchant = { id: 'm', slug: 'b', name: 'Sawa Studio', bio: { en: 'Bio', ar: 'نبذة' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 0 } as const;
const product = { id: 'p', merchantId: 'm', categoryId: 'c', name: { en: 'Black jacket', ar: 'جاكيت أسود' }, description: { en: 'd', ar: 'د' }, visualDescription: 'v', gender: 'UNISEX', status: 'ACTIVE', pricePiasters: 45_000, images: [], variants: [] } as const;

export const previews: ScreenPreviews = {
  screen: 'Search',
  states: [
    { name: 'Before searching', element: view({ kind: 'idle' }) },
    { name: 'Loading', element: view({ kind: 'searching' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Results closest first', element: view({ kind: 'results', products: [product], merchants: [merchant] }) },
    { name: 'Nothing in budget', element: view({ kind: 'nothingInBudget' }) },
    { name: 'No results', element: view({ kind: 'noResults' }) },
  ],
};
