import type { Id } from '../../../core/domain/catalog';
import type { CatalogRepository, FollowRepository } from '../../../core/domain/ports';
import { BrandView } from './BrandView';
import { useBrandViewModel } from './useBrandViewModel';

export interface BrandScreenProps {
  readonly merchantId: Id;
  readonly catalog: CatalogRepository;
  readonly follows: FollowRepository;
  readonly onOpenProduct: (id: Id) => void;
}

export function BrandScreen({ merchantId, catalog, follows, onOpenProduct }: BrandScreenProps) {
  const { state, reload, followOverride, toggleFollow } = useBrandViewModel(merchantId, catalog, follows);
  const isFollowing = followOverride ?? (state.kind === 'loaded' && state.value.isFollowing);
  return <BrandView state={state} isFollowing={isFollowing} onRetry={reload} onToggleFollow={toggleFollow} onOpenProduct={onOpenProduct} />;
}
