import type { ShopperRecordsRepository } from '../../../core/domain/ports';
import { ShopperHistoryView } from './ShopperHistoryView';
import { useShopperHistoryViewModel } from './useShopperHistoryViewModel';

export interface ShopperHistoryScreenProps {
  readonly records: ShopperRecordsRepository;
}

export function ShopperHistoryScreen({ records }: ShopperHistoryScreenProps) {
  const model = useShopperHistoryViewModel(records);
  return (
    <ShopperHistoryView
      state={model.state}
      stopping={model.stopping}
      saveFailed={model.saveFailed}
      onRetry={model.reload}
      onRate={model.rate}
      onAskToStop={model.askToStop}
      onKeepAccepting={model.keepAccepting}
      onSetBlocked={model.setBlocked}
    />
  );
}
