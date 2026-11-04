import type { Id } from '../../../core/domain/catalog';
import type { PhotoToShopGateway } from '../../../core/domain/ports';
import { PhotoToShopView } from './PhotoToShopView';
import { usePhotoToShopViewModel } from './usePhotoToShopViewModel';

export interface PhotoToShopScreenProps {
  readonly gateway: PhotoToShopGateway;
  readonly onOpenProduct: (id: Id) => void;
}

export function PhotoToShopScreen({ gateway, onOpenProduct }: PhotoToShopScreenProps) {
  const { state, pick, selectPiece, reset } = usePhotoToShopViewModel(gateway);
  return (
    <PhotoToShopView
      state={state}
      onPick={(file) => pick(file, URL.createObjectURL(file))}
      onSelectPiece={selectPiece}
      onReset={reset}
      onOpenProduct={onOpenProduct}
    />
  );
}
