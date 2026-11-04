import type { MerchantOrdersRepository } from '../../../core/domain/ports';
import { MerchantOrdersView } from './MerchantOrdersView';
import { useMerchantOrdersViewModel } from './useMerchantOrdersViewModel';

export interface MerchantOrdersScreenProps {
  readonly orders: MerchantOrdersRepository;
}

export function MerchantOrdersScreen({ orders }: MerchantOrdersScreenProps) {
  const model = useMerchantOrdersViewModel(orders);
  return (
    <MerchantOrdersView
      state={model.state}
      tab={model.tab}
      rejecting={model.rejecting}
      saveFailed={model.saveFailed}
      onRetry={model.reload}
      onSelectTab={model.setTab}
      onMove={model.move}
      onAskToReject={model.askToReject}
      onKeepOrder={model.keepOrder}
    />
  );
}
