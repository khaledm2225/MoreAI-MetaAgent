import { useCallback, useState } from 'react';
import type { AppSettings, NotificationPreferences } from '../../../core/domain/account';
import type { NotificationsRepository, SessionRepository, SettingsRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export interface SettingsData {
  readonly settings: AppSettings;
  readonly notifications: NotificationPreferences;
}

export function useSettingsViewModel(
  settings: Pick<SettingsRepository, 'current' | 'setShowMoreAiButton'>,
  notifications: Pick<NotificationsRepository, 'preferences' | 'setMarketingConsent'>,
  session: Pick<SessionRepository, 'deleteAccount'>,
  onDeleted: () => void,
) {
  const { state, reload, refresh } = useLoadable<SettingsData>(
    async () => {
      const [current, preferences] = await Promise.all([settings.current(), notifications.preferences()]);
      return { settings: current, notifications: preferences };
    },
    [settings, notifications],
  );
  const [saveFailed, setSaveFailed] = useState(false);
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const save = useCallback(
    (change: Promise<unknown>) => {
      setSaveFailed(false);
      change.then(refresh, () => setSaveFailed(true));
    },
    [refresh],
  );

  return {
    state,
    reload,
    saveFailed,
    isConfirmingDelete,
    isDeleting,
    setShowMoreAi: useCallback((show: boolean) => save(settings.setShowMoreAiButton(show)), [settings, save]),
    setMarketing: useCallback((consent: boolean) => save(notifications.setMarketingConsent(consent)), [notifications, save]),
    askToDelete: useCallback(() => setConfirmingDelete(true), []),
    keepAccount: useCallback(() => setConfirmingDelete(false), []),
    deleteAccount: useCallback(() => {
      setDeleting(true);
      session.deleteAccount().then(onDeleted, () => {
        setDeleting(false);
        setConfirmingDelete(false);
        setSaveFailed(true);
      });
    }, [session, onDeleted]),
  };
}
