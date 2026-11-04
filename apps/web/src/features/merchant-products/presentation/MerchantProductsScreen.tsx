import type { MerchantProductsRepository } from '../../../core/domain/ports';
import { MerchantProductsView } from './MerchantProductsView';
import { useMerchantProductsViewModel } from './useMerchantProductsViewModel';

export interface MerchantProductsScreenProps {
  readonly products: Pick<MerchantProductsRepository, 'list' | 'setStatus'>;
  readonly onAdd: () => void;
}

export function MerchantProductsScreen({ products, onAdd }: MerchantProductsScreenProps) {
  const model = useMerchantProductsViewModel(products);
  return (
    <MerchantProductsView
      state={model.state}
      status={model.status}
      saveFailed={model.saveFailed}
      onRetry={model.reload}
      onSelectStatus={model.setStatus}
      onMove={model.move}
      onAdd={onAdd}
    />
  );
}
