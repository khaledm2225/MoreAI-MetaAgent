import type { MerchantProfileRepository } from '../../../core/domain/ports';
import { MerchantJoinView } from './MerchantJoinView';
import { useMerchantJoinViewModel } from './useMerchantJoinViewModel';

export interface MerchantJoinScreenProps {
  readonly profile: Pick<MerchantProfileRepository, 'join'>;
  readonly onAddProducts: () => void;
}

export function MerchantJoinScreen({ profile, onAddProducts }: MerchantJoinScreenProps) {
  const { state, imageUrl, pickImage, clearImage, join } = useMerchantJoinViewModel(profile);
  return (
    <MerchantJoinView
      state={state}
      imageUrl={imageUrl}
      onPickImage={(file) => pickImage(file, URL.createObjectURL(file))}
      onClearImage={clearImage}
      onJoin={join}
      onAddProducts={onAddProducts}
    />
  );
}
