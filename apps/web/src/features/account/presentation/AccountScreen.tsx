import type { PreferencesRepository } from '../../../core/domain/ports';
import { AccountView } from './AccountView';
import { useAccountViewModel } from './useAccountViewModel';

export interface AccountScreenProps {
  readonly preferences: PreferencesRepository;
  readonly onOpenOrders: () => void;
  readonly onOpenNotifications: () => void;
  readonly onOpenSettings: () => void;
}

/** The client's account, with their preferences as animated bullet points. */
export function AccountScreen({ preferences, onOpenOrders, onOpenNotifications, onOpenSettings }: AccountScreenProps) {
  const model = useAccountViewModel(preferences);
  return (
    <AccountView
      state={model.state}
      edit={model.edit}
      onRetry={model.reload}
      onStartEditing={model.startEditing}
      onCancelEditing={model.cancelEditing}
      onAdd={model.add}
      onRemove={model.remove}
      onOpenOrders={onOpenOrders}
      onOpenNotifications={onOpenNotifications}
      onOpenSettings={onOpenSettings}
    />
  );
}
