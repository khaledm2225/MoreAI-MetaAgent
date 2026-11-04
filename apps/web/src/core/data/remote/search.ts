import type { Product } from '../../domain/catalog';
import type { ProductSearch } from '../../domain/ports';
import type { ProductQuery } from '../../domain/search';
import { readShopperRequest } from '../static/requestReader';
import type { ApiClient, SearchRequest } from './api';

/** How far below the best match a piece can be and still be about the same thing. */
const SCORE_BAND = 0.06;
/** A short request names what it wants. A long description, such as from a photo, is matched by meaning only. */
const SHORT_REQUEST_WORDS = 8;
const DEFAULT_LIMIT = 24;
/** The backend's limit. A long description from a photo is cut to fit. */
const MAX_QUERY_CHARS = 300;
const hasArabic = (text: string) => /\p{Script=Arabic}/u.test(text);
/** Products a merchant just added in this browser. They're matched here, since vectors take a while to update. */
const isOwnProduct = (product: Product) => product.id.includes('-new-');

/** The index only knows English, so Arabic words become the English words they mean. */
export function toIndexWords(text: string): string {
  if (!hasArabic(text)) {
    return text;
  }
  const { colorCode, categorySlug, styleWord } = readShopperRequest(text);
  return [colorCode, styleWord, categorySlug].filter((word) => word !== undefined).join(' ');
}

/** "black jacket under 500" means a black jacket and a budget, enforced as hard filters, not as a hope. */
export function withStatedFilters(query: ProductQuery): ProductQuery {
  const text = query.text ?? '';
  if (text.trim().split(/\s+/).length > SHORT_REQUEST_WORDS) {
    return query;
  }
  const stated = readShopperRequest(text);
  return {
    ...query,
    ...(query.categoryId === undefined && stated.categorySlug !== undefined ? { categoryId: `category-${stated.categorySlug}` } : {}),
    ...(query.colorCode === undefined && stated.colorCode !== undefined ? { colorCode: stated.colorCode } : {}),
    ...(query.maxPricePiasters === undefined && stated.maxPricePiasters !== undefined ? { maxPricePiasters: stated.maxPricePiasters } : {}),
  };
}

export function createRemoteProductSearch(api: Pick<ApiClient, 'search'>, local: ProductSearch): ProductSearch {
  return {
    search: async (given: ProductQuery): Promise<readonly Product[]> => {
      const query = withStatedFilters(given);
      const words = toIndexWords(query.text ?? '');
      if (words.trim() === '') {
        return local.search(query);
      }
      const { text: _text, limit, ...hardFilters } = query;
      const allowed = await local.search(hardFilters);
      const request: SearchRequest = {
        text: words.slice(0, MAX_QUERY_CHARS),
        ...(query.maxPricePiasters === undefined ? {} : { maxPricePiasters: query.maxPricePiasters }),
        ...(query.categoryId === undefined ? {} : { categoryId: query.categoryId }),
        ...(query.colorCode === undefined ? {} : { colorCode: query.colorCode }),
      };
      try {
        const answer = await api.search(request);
        if (answer.limited) {
          return await local.search(query);
        }
        // The budget and filters are checked again here, in code, against what the page knows.
        const byId = new Map(allowed.map((product) => [product.id, product]));
        const best = answer.matches[0]?.score ?? 0;
        const closest = answer.matches
          .filter(({ score }) => score >= best - SCORE_BAND)
          .flatMap(({ id }) => {
            const product = byId.get(id);
            return product === undefined ? [] : [product];
          });
        const own = (await local.search(query)).filter(isOwnProduct);
        return [...own, ...closest].slice(0, limit ?? DEFAULT_LIMIT);
      } catch {
        return local.search(query);
      }
    },
  };
}
