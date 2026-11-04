import type { NotificationsRepository, SessionRepository, SettingsRepository } from '../../../core/domain/ports';
import { SettingsView } from './SettingsView';
import { useSettingsViewModel } from './useSettingsViewModel';

export interface SettingsScreenProps {
  readonly settings: Pick<SettingsRepository, 'current' | 'setShowMoreAiButton'>;
  readonly notifications: Pick<NotificationsRepository, 'preferences' | 'setMarketingConsent'>;
  readonly session: Pick<SessionRepository, 'deleteAccount'>;
  readonly onDeleted: () => void;
}

export function SettingsScreen({ settings, notifications, session, onDeleted }: SettingsScreenProps) {
  const model = useSettingsViewModel(settings, notifications, session, onDeleted);
  return (
    <SettingsView
      state={model.state}
      saveFailed={model.saveFailed}
      isConfirmingDelete={model.isConfirmingDelete}
      isDeleting={model.isDeleting}
      onRetry={model.reload}
      onSetShowMoreAi={model.setShowMoreAi}
      onSetMarketing={model.setMarketing}
      onAskToDelete={model.askToDelete}
      onKeepAccount={model.keepAccount}
      onDeleteAccount={model.deleteAccount}
    />
  );
}
