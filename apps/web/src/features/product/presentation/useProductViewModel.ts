import { useCallback, useState } from 'react';
import type { Color, Id, Merchant, Product, Size } from '../../../core/domain/catalog';
import type { CartRepository, CatalogRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export interface ProductData {
  readonly product: Product | null;
  readonly merchant: Merchant | null;
  readonly colors: readonly Color[];
  readonly sizes: readonly Size[];
}

export type AddState = 'idle' | 'adding' | 'added' | 'failed';

export function useProductViewModel(productId: Id, catalog: CatalogRepository, cart: Pick<CartRepository, 'addPiece'>) {
  const { state, reload } = useLoadable<ProductData>(
    async () => {
      const product = await catalog.getProduct(productId);
      const [merchant, colors, sizes] = await Promise.all([
        product === null ? Promise.resolve(null) : catalog.getMerchant(product.merchantId),
        catalog.listColors(),
        catalog.listSizes(),
      ]);
      return { product, merchant, colors, sizes };
    },
    [productId, catalog],
  );
  const [variantId, setVariantId] = useState<Id | null>(null);
  const [addState, setAddState] = useState<AddState>('idle');

  const chooseVariant = useCallback((id: Id) => {
    setVariantId(id);
    setAddState('idle');
  }, []);

  const add = useCallback(() => {
    if (variantId === null) {
      return;
    }
    setAddState('adding');
    cart.addPiece(productId, variantId, 1).then(
      () => setAddState('added'),
      () => setAddState('failed'),
    );
  }, [cart, productId, variantId]);

  return { state, reload, variantId, addState, chooseVariant, add };
}
