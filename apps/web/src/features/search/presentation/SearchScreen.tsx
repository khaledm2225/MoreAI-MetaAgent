import type { Id } from '../../../core/domain/catalog';
import type { CatalogRepository, ProductSearch } from '../../../core/domain/ports';
import { SearchView } from './SearchView';
import { useSearchViewModel } from './useSearchViewModel';

export interface SearchScreenProps {
  readonly search: ProductSearch;
  readonly catalog: Pick<CatalogRepository, 'listMerchants'>;
  readonly onOpenProduct: (id: Id) => void;
}

export function SearchScreen({ search, catalog, onOpenProduct }: SearchScreenProps) {
  const { state, run } = useSearchViewModel(search, catalog);
  return <SearchView state={state} onSearch={(text, budget) => void run(text, budget)} onOpenProduct={onOpenProduct} />;
}
