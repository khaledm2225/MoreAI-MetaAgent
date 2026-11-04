import type { Color, Id, Product, ProductVariant, Size } from './catalog';

export interface ProductQuery {
  /** The shopper's words or the AI's description, matched by closeness. */
  readonly text?: string;
  readonly merchantId?: Id;
  readonly categoryId?: Id;
  readonly colorCode?: string;
  readonly sizeLabel?: string;
  /** A hard limit, checked in code. The AI never gets to judge a price. */
  readonly maxPricePiasters?: number;
  readonly limit?: number;
}

export interface SearchLookups {
  readonly colors: readonly Color[];
  readonly sizes: readonly Size[];
}

export function priceOfVariant(product: Product, variant: ProductVariant): number {
  return variant.pricePiasters ?? product.pricePiasters;
}

export function isBuyable(variant: ProductVariant): boolean {
  return variant.isAvailable && variant.stockQuantity > 0;
}

export function cheapestPriceOf(product: Product): number {
  const prices = product.variants.filter(isBuyable).map((variant) => priceOfVariant(product, variant));
  return prices.length === 0 ? product.pricePiasters : Math.min(...prices);
}

function words(text: string): readonly string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1);
}

function closeness(product: Product, queryWords: readonly string[]): number {
  if (queryWords.length === 0) {
    return 1;
  }
  const searchable = new Set(
    words(
      [product.visualDescription, product.name.en, product.name.ar, product.description.en, product.description.ar].join(' '),
    ),
  );
  const matched = queryWords.filter((word) => searchable.has(word)).length;
  return matched / queryWords.length;
}

function variantFits(product: Product, variant: ProductVariant, query: ProductQuery, lookups: SearchLookups): boolean {
  if (!isBuyable(variant)) {
    return false;
  }
  if (query.colorCode !== undefined) {
    const color = lookups.colors.find(({ id }) => id === variant.colorId);
    if (color?.code !== query.colorCode) {
      return false;
    }
  }
  if (query.sizeLabel !== undefined) {
    const size = lookups.sizes.find(({ id }) => id === variant.sizeId);
    if (size?.label !== query.sizeLabel) {
      return false;
    }
  }
  return query.maxPricePiasters === undefined || priceOfVariant(product, variant) <= query.maxPricePiasters;
}

/**
 * The search rules that hold everywhere. Filters are hard rules checked in code, and
 * what's left is ordered by how close it is to the words. Vectors can replace the
 * closeness later, and these rules stay.
 */
export function searchProducts(
  products: readonly Product[],
  query: ProductQuery,
  lookups: SearchLookups,
): readonly Product[] {
  const queryWords = words(query.text ?? '');
  const matches = products
    .filter(
      (product) =>
        product.status === 'ACTIVE' &&
        (query.merchantId === undefined || product.merchantId === query.merchantId) &&
        (query.categoryId === undefined || product.categoryId === query.categoryId) &&
        product.variants.some((variant) => variantFits(product, variant, query, lookups)),
    )
    .map((product) => ({ product, score: closeness(product, queryWords) }))
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score)
    .map(({ product }) => product);
  return query.limit === undefined ? matches : matches.slice(0, query.limit);
}
