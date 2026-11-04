import type { Category, Color, Merchant, Product, ProductVariant, Size } from '../core/domain/catalog';
import type { CatalogRepository } from '../core/domain/ports';

export const testMerchant: Merchant = {
  id: 'm',
  slug: 'brand',
  name: 'Brand',
  bio: { en: 'A brand', ar: 'براند' },
  logoPath: null,
  status: 'LIVE',
  deliveryFeePiasters: 5_000,
};

export function testVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return { id: 'v', productId: 'p', colorId: 'black', sizeId: 'size-m', pricePiasters: null, stockQuantity: 3, isAvailable: true, ...overrides };
}

export function testProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p',
    merchantId: 'm',
    categoryId: 'jackets',
    name: { en: 'Black jacket', ar: 'جاكيت أسود' },
    description: { en: 'A jacket', ar: 'جاكيت' },
    visualDescription: 'black jacket',
    gender: 'UNISEX',
    status: 'ACTIVE',
    pricePiasters: 45_000,
    images: [],
    variants: [testVariant()],
    ...overrides,
  };
}

const categories: readonly Category[] = [{ id: 'jackets', parentId: null, slug: 'jackets', name: { en: 'Jackets', ar: 'جواكت' }, sortOrder: 1 }];
const colors: readonly Color[] = [{ id: 'black', code: 'black', name: { en: 'Black', ar: 'أسود' }, hex: '#000000' }];
const sizes: readonly Size[] = [{ id: 'size-m', label: 'M', sortOrder: 1 }, { id: 'size-l', label: 'L', sortOrder: 2 }];

export function fakeCatalog(products: readonly Product[], merchants: readonly Merchant[] = [testMerchant]): CatalogRepository {
  return {
    listMerchants: () => Promise.resolve(merchants),
    getMerchant: (id) => Promise.resolve(merchants.find((merchant) => merchant.id === id) ?? null),
    listProducts: (merchantId) => Promise.resolve(products.filter((product) => merchantId === undefined || product.merchantId === merchantId)),
    getProduct: (id) => Promise.resolve(products.find((product) => product.id === id) ?? null),
    listCategories: () => Promise.resolve(categories),
    listColors: () => Promise.resolve(colors),
    listSizes: () => Promise.resolve(sizes),
  };
}

/** A port that fails, for testing error states. */
export const failing = (): Promise<never> => Promise.reject(new Error('The server is down.'));
