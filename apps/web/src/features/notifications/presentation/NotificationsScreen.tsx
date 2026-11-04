import type { NotificationsRepository } from '../../../core/domain/ports';
import { NotificationsView } from './NotificationsView';
import { useNotificationsViewModel } from './useNotificationsViewModel';

export interface NotificationsScreenProps {
  readonly notifications: NotificationsRepository;
}

export function NotificationsScreen({ notifications }: NotificationsScreenProps) {
  const model = useNotificationsViewModel(notifications);
  return (
    <NotificationsView
      state={model.state}
      saveFailed={model.saveFailed}
      onRetry={model.reload}
      onSetMarketingConsent={model.setMarketingConsent}
      onSetMerchantMuted={model.setMerchantMuted}
    />
  );
}
