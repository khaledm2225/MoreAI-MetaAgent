import { useCallback, useState } from 'react';
import type { Id, Merchant, Product } from '../../../core/domain/catalog';
import type { CatalogRepository, FollowRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export interface BrandData {
  readonly merchant: Merchant | null;
  readonly products: readonly Product[];
  readonly isFollowing: boolean;
}

export function useBrandViewModel(merchantId: Id, catalog: CatalogRepository, follows: FollowRepository) {
  const { state, reload } = useLoadable<BrandData>(
    async () => {
      const [merchant, products, isFollowing] = await Promise.all([
        catalog.getMerchant(merchantId),
        catalog.listProducts(merchantId),
        follows.isFollowing(merchantId),
      ]);
      return { merchant, products, isFollowing };
    },
    [merchantId, catalog, follows],
  );
  const [followOverride, setFollowOverride] = useState<boolean | null>(null);

  const toggleFollow = useCallback(
    (next: boolean) => {
      setFollowOverride(next);
      follows.setFollowing(merchantId, next).catch(() => setFollowOverride(!next));
    },
    [follows, merchantId],
  );

  return { state, reload, followOverride, toggleFollow };
}
