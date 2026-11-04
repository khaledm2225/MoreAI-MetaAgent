import type { ListingAssistant, MerchantProductsRepository } from '../../../core/domain/ports';
import { MerchantAddProductView } from './MerchantAddProductView';
import { useMerchantAddProductViewModel } from './useMerchantAddProductViewModel';

export interface MerchantAddProductScreenProps {
  readonly assistant: ListingAssistant;
  readonly products: Pick<MerchantProductsRepository, 'saveDraft' | 'publish'>;
  readonly onSeeProducts: () => void;
}

export function MerchantAddProductScreen({ assistant, products, onSeeProducts }: MerchantAddProductScreenProps) {
  const { state, pick, edit, save, reset } = useMerchantAddProductViewModel(assistant, products);
  return (
    <MerchantAddProductView
      state={state}
      onPick={(file) => pick(file, URL.createObjectURL(file))}
      onEdit={edit}
      onSave={save}
      onReset={reset}
      onSeeProducts={onSeeProducts}
    />
  );
}
