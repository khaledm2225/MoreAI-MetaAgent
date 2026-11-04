import type { Product, ProductVariant } from '../../core/domain/catalog';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { ProductView } from './presentation/ProductView';
import type { AddState, ProductData } from './presentation/useProductViewModel';

const noop = () => {};
const variant = (id: string, stockQuantity: number): ProductVariant => ({ id, productId: 'p', colorId: 'black', sizeId: id, pricePiasters: null, stockQuantity, isAvailable: true });
const product = (variants: readonly ProductVariant[]): Product => ({ id: 'p', merchantId: 'm', categoryId: 'c', name: { en: 'Black oversized jacket', ar: 'جاكيت أسود واسع' }, description: { en: 'A relaxed jacket that goes with any outfit.', ar: 'جاكيت واسع وهادي، ينفع مع أي Outfit.' }, visualDescription: 'v', gender: 'UNISEX', status: 'ACTIVE', pricePiasters: 45_000, images: [], variants });
const loaded = (variants: readonly ProductVariant[]): Loadable<ProductData> => ({
  kind: 'loaded',
  value: {
    product: product(variants),
    merchant: { id: 'm', slug: 'b', name: 'Sawa Studio', bio: { en: 'b', ar: 'ب' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 0 },
    colors: [{ id: 'black', code: 'black', name: { en: 'Black', ar: 'أسود' }, hex: '#000' }],
    sizes: [{ id: 's', label: 'S', sortOrder: 1 }, { id: 'm', label: 'M', sortOrder: 2 }, { id: 'l', label: 'L', sortOrder: 3 }],
  },
});
const some = [variant('s', 2), variant('m', 3), variant('l', 0)];
const view = (state: Loadable<ProductData>, variantId: string | null = null, addState: AddState = 'idle') => (
  <ProductView state={state} variantId={variantId} addState={addState} onRetry={noop} onChooseVariant={noop} onAdd={noop} onOpenBrand={noop} onOpenCart={noop} />
);

export const previews: ScreenPreviews = {
  screen: 'Product details',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'No size chosen, size sold out', element: view(loaded(some)) },
    { name: 'Size chosen', element: view(loaded(some), 'm') },
    { name: 'All sold out', element: view(loaded([variant('s', 0), variant('m', 0)])) },
    { name: 'Added to cart', element: view(loaded(some), 'm', 'added') },
  ],
};
