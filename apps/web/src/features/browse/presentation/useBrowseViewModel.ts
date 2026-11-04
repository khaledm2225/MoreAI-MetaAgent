import { useCallback, useMemo, useState } from 'react';
import type { Category, Id, Merchant, Product } from '../../../core/domain/catalog';
import type { CatalogRepository } from '../../../core/domain/ports';
import { useLoadable, type Loadable } from '../../../core/presentation/useLoadable';

export const PAGE_SIZE = 24;

export interface BrowseData {
  readonly merchants: readonly Merchant[];
  readonly categories: readonly Category[];
  readonly products: readonly Product[];
}

export function useBrowseViewModel(catalog: CatalogRepository) {
  const { state, reload } = useLoadable<BrowseData>(
    async () => {
      const [merchants, categories, products] = await Promise.all([
        catalog.listMerchants(),
        catalog.listCategories(),
        catalog.listProducts(),
      ]);
      return { merchants, categories, products };
    },
    [catalog],
  );
  const [categoryId, setCategoryId] = useState<Id | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  const selectCategory = useCallback((id: Id | null) => {
    setCategoryId(id);
    setShown(PAGE_SIZE);
  }, []);
  const showMore = useCallback(() => setShown((count) => count + PAGE_SIZE), []);

  const view: Loadable<BrowseData> = state;
  const matching = useMemo(
    () =>
      view.kind === 'loaded'
        ? view.value.products.filter((product) => categoryId === null || product.categoryId === categoryId)
        : [],
    [view, categoryId],
  );

  return { state, reload, categoryId, selectCategory, visible: matching.slice(0, shown), hasMore: matching.length > shown, showMore };
}
