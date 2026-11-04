import { useCallback, useRef, useState } from 'react';
import type { Merchant, Product } from '../../../core/domain/catalog';
import type { CatalogRepository, ProductSearch } from '../../../core/domain/ports';

const PIASTERS_PER_POUND = 100;

export type SearchState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'searching' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'invalidBudget' }
  | { readonly kind: 'noResults' }
  | { readonly kind: 'nothingInBudget' }
  | { readonly kind: 'results'; readonly products: readonly Product[]; readonly merchants: readonly Merchant[] };

/** Reads a budget in whole pounds. Empty means no budget, and null means it can't be read. */
export function readBudgetPiasters(text: string): number | undefined | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return undefined;
  }
  return /^\d+$/.test(trimmed) ? Number(trimmed) * PIASTERS_PER_POUND : null;
}

export function useSearchViewModel(search: ProductSearch, catalog: Pick<CatalogRepository, 'listMerchants'>) {
  const [state, setState] = useState<SearchState>({ kind: 'idle' });
  const latest = useRef(0);

  const run = useCallback(
    async (text: string, budget: string) => {
      const maxPricePiasters = readBudgetPiasters(budget);
      if (maxPricePiasters === null) {
        setState({ kind: 'invalidBudget' });
        return;
      }
      latest.current += 1;
      const request = latest.current;
      setState({ kind: 'searching' });
      try {
        const products = await search.search({
          text,
          ...(maxPricePiasters === undefined ? {} : { maxPricePiasters }),
        });
        let next: SearchState;
        if (products.length > 0) {
          next = { kind: 'results', products, merchants: await catalog.listMerchants() };
        } else if (maxPricePiasters === undefined) {
          next = { kind: 'noResults' };
        } else {
          const withoutBudget = await search.search({ text, limit: 1 });
          next = { kind: withoutBudget.length > 0 ? 'nothingInBudget' : 'noResults' };
        }
        if (request === latest.current) {
          setState(next);
        }
      } catch {
        if (request === latest.current) {
          setState({ kind: 'failed' });
        }
      }
    },
    [search, catalog],
  );

  return { state, run };
}
