import { describe, expect, it } from 'vitest';
import type { Color, Product, ProductVariant, Size } from './catalog';
import { cheapestPriceOf, priceOfVariant, searchProducts } from './search';

const black: Color = { id: 'c-black', code: 'black', name: { en: 'Black', ar: 'أسود' }, hex: '#1C1412' };
const beige: Color = { id: 'c-beige', code: 'beige', name: { en: 'Beige', ar: 'بيج' }, hex: '#EBDDBF' };
const large: Size = { id: 's-l', label: 'L', sortOrder: 3 };
const small: Size = { id: 's-s', label: 'S', sortOrder: 1 };
const lookups = { colors: [black, beige], sizes: [small, large] };

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 'v',
    productId: 'p',
    colorId: black.id,
    sizeId: large.id,
    pricePiasters: null,
    stockQuantity: 4,
    isAvailable: true,
    ...overrides,
  };
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p',
    merchantId: 'm',
    categoryId: 'jackets',
    name: { en: 'Jacket', ar: 'جاكيت' },
    description: { en: 'A jacket', ar: 'جاكيت' },
    visualDescription: 'black jacket, oversized, casual',
    gender: 'UNISEX',
    status: 'ACTIVE',
    pricePiasters: 50_000,
    images: [],
    variants: [variant()],
    ...overrides,
  };
}

const ids = (products: readonly Product[]) => products.map(({ id }) => id);

describe('searchProducts', () => {
  const jacketAt1000 = product({ id: 'jacket-1000', pricePiasters: 100_000 });
  const jacketAt500 = product({ id: 'jacket-500', pricePiasters: 50_000 });

  it('shows a black jacket to a shopper who asks for one', () => {
    expect(ids(searchProducts([jacketAt1000], { text: 'black jacket' }, lookups))).toEqual([
      'jacket-1000',
    ]);
  });

  it('never shows a 1,000 EGP jacket to a shopper with a 500 EGP budget', () => {
    const found = searchProducts(
      [jacketAt1000, jacketAt500],
      { text: 'black jacket', maxPricePiasters: 50_000 },
      lookups,
    );
    expect(ids(found)).toEqual(['jacket-500']);
  });

  it('finds nothing when nothing fits the budget, instead of showing something else', () => {
    expect(
      searchProducts([jacketAt1000], { text: 'black jacket', maxPricePiasters: 50_000 }, lookups),
    ).toEqual([]);
  });

  it('puts what is closest to the description first', () => {
    const closest = product({ id: 'close', visualDescription: 'black jacket, oversized' });
    const partly = product({
      id: 'partly',
      name: { en: 'Hoodie', ar: 'هودي' },
      description: { en: 'A hoodie', ar: 'هودي' },
      visualDescription: 'black hoodie',
    });
    expect(ids(searchProducts([partly, closest], { text: 'black jacket' }, lookups))).toEqual([
      'close',
      'partly',
    ]);
  });

  it('leaves out what has nothing in common with the description', () => {
    const shoes = product({
      id: 'shoes',
      name: { en: 'Sneakers', ar: 'كوتشي' },
      description: { en: 'Sneakers', ar: 'كوتشي' },
      visualDescription: 'white sneakers',
    });
    expect(searchProducts([shoes], { text: 'black jacket' }, lookups)).toEqual([]);
  });

  it('matches Arabic words against the product name', () => {
    expect(ids(searchProducts([jacketAt500], { text: 'جاكيت' }, lookups))).toEqual(['jacket-500']);
  });

  it.each(['DRAFT', 'HIDDEN', 'ARCHIVED'] as const)('never shows a %s product', (status) => {
    expect(searchProducts([product({ status })], {}, lookups)).toEqual([]);
  });

  it('never shows a sold out product', () => {
    const soldOut = product({ variants: [variant({ stockQuantity: 0 })] });
    const switchedOff = product({ variants: [variant({ isAvailable: false })] });
    expect(searchProducts([soldOut, switchedOff], {}, lookups)).toEqual([]);
  });

  it('checks color and size on one variant that can really be bought', () => {
    const blackLargeSoldOut = product({
      id: 'mixed',
      variants: [
        variant({ id: 'a', colorId: black.id, sizeId: large.id, stockQuantity: 0 }),
        variant({ id: 'b', colorId: beige.id, sizeId: large.id }),
        variant({ id: 'c', colorId: black.id, sizeId: small.id }),
      ],
    });
    expect(searchProducts([blackLargeSoldOut], { colorCode: 'black', sizeLabel: 'L' }, lookups)).toEqual([]);
    expect(ids(searchProducts([blackLargeSoldOut], { colorCode: 'beige', sizeLabel: 'L' }, lookups))).toEqual(['mixed']);
  });

  it('judges the budget on a variant that fits the request', () => {
    const pricier = product({
      id: 'pricier',
      pricePiasters: 40_000,
      variants: [variant({ id: 'a', sizeId: large.id, pricePiasters: 90_000 }), variant({ id: 'b', sizeId: small.id })],
    });
    expect(searchProducts([pricier], { sizeLabel: 'L', maxPricePiasters: 50_000 }, lookups)).toEqual([]);
    expect(ids(searchProducts([pricier], { sizeLabel: 'S', maxPricePiasters: 50_000 }, lookups))).toEqual(['pricier']);
  });

  it('filters by brand and category', () => {
    const other = product({ id: 'other', merchantId: 'm2', categoryId: 'hoodies' });
    expect(ids(searchProducts([jacketAt500, other], { merchantId: 'm2' }, lookups))).toEqual(['other']);
    expect(ids(searchProducts([jacketAt500, other], { categoryId: 'jackets' }, lookups))).toEqual(['jacket-500']);
  });

  it('stops at the limit', () => {
    const first = product({ id: 'a' });
    const second = product({ id: 'b' });
    expect(searchProducts([first, second], { limit: 1 }, lookups)).toHaveLength(1);
  });
});

describe('prices', () => {
  it('uses the variant price when it has one', () => {
    const item = product({ pricePiasters: 50_000 });
    expect(priceOfVariant(item, variant())).toBe(50_000);
    expect(priceOfVariant(item, variant({ pricePiasters: 70_000 }))).toBe(70_000);
  });

  it('finds the cheapest price that can be bought', () => {
    const item = product({
      pricePiasters: 50_000,
      variants: [
        variant({ id: 'a', pricePiasters: 30_000, stockQuantity: 0 }),
        variant({ id: 'b', pricePiasters: 40_000 }),
      ],
    });
    expect(cheapestPriceOf(item)).toBe(40_000);
  });

  it('falls back to the product price when nothing can be bought', () => {
    const item = product({ pricePiasters: 50_000, variants: [] });
    expect(cheapestPriceOf(item)).toBe(50_000);
  });
});
