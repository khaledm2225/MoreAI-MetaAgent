import { useCallback, useState } from 'react';
import type { Id, ProductStatus } from '../../../core/domain/catalog';
import type { MerchantProductsRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export function useMerchantProductsViewModel(products: Pick<MerchantProductsRepository, 'list' | 'setStatus'>) {
  const { state, reload, refresh } = useLoadable(() => products.list(), [products]);
  const [status, setStatus] = useState<ProductStatus>('ACTIVE');
  const [saveFailed, setSaveFailed] = useState(false);

  const move = useCallback(
    (productId: Id, next: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED') => {
      setSaveFailed(false);
      products.setStatus(productId, next).then(refresh, () => setSaveFailed(true));
    },
    [products, refresh],
  );

  return { state, reload, status, setStatus, saveFailed, move };
}
