import type { Id } from '../../../core/domain/catalog';
import type { CatalogRepository } from '../../../core/domain/ports';
import { BrowseView } from './BrowseView';
import { useBrowseViewModel } from './useBrowseViewModel';

export interface BrowseScreenProps {
  readonly catalog: CatalogRepository;
  readonly onOpenBrand: (id: Id) => void;
  readonly onOpenProduct: (id: Id) => void;
}

export function BrowseScreen({ catalog, onOpenBrand, onOpenProduct }: BrowseScreenProps) {
  const model = useBrowseViewModel(catalog);
  return (
    <BrowseView
      state={model.state}
      categoryId={model.categoryId}
      visible={model.visible}
      hasMore={model.hasMore}
      onRetry={model.reload}
      onSelectCategory={model.selectCategory}
      onShowMore={model.showMore}
      onOpenBrand={onOpenBrand}
      onOpenProduct={onOpenProduct}
    />
  );
}
