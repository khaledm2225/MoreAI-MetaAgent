import type { Id } from '../../../core/domain/catalog';
import type { CartRepository, CatalogRepository } from '../../../core/domain/ports';
import { ProductView } from './ProductView';
import { useProductViewModel } from './useProductViewModel';

export interface ProductScreenProps {
  readonly productId: Id;
  readonly catalog: CatalogRepository;
  readonly cart: Pick<CartRepository, 'addPiece'>;
  readonly onOpenBrand: (id: Id) => void;
  readonly onOpenCart: () => void;
}

export function ProductScreen({ productId, catalog, cart, onOpenBrand, onOpenCart }: ProductScreenProps) {
  const model = useProductViewModel(productId, catalog, cart);
  return (
    <ProductView
      state={model.state}
      variantId={model.variantId}
      addState={model.addState}
      onRetry={model.reload}
      onChooseVariant={model.chooseVariant}
      onAdd={model.add}
      onOpenBrand={onOpenBrand}
      onOpenCart={onOpenCart}
    />
  );
}
