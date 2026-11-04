import { useCallback, useState } from 'react';
import type { AppNotification, NotificationPreferences } from '../../../core/domain/account';
import type { Id } from '../../../core/domain/catalog';
import type { NotificationsRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export interface NotificationsData {
  readonly items: readonly AppNotification[];
  readonly preferences: NotificationPreferences;
}

export function useNotificationsViewModel(notifications: NotificationsRepository) {
  const { state, reload, refresh } = useLoadable<NotificationsData>(
    async () => {
      const [items, preferences] = await Promise.all([notifications.list(), notifications.preferences()]);
      return { items, preferences };
    },
    [notifications],
  );
  const [saveFailed, setSaveFailed] = useState(false);

  const save = useCallback(
    (change: Promise<NotificationPreferences>) => {
      setSaveFailed(false);
      change.then(refresh, () => setSaveFailed(true));
    },
    [refresh],
  );

  return {
    state,
    reload,
    saveFailed,
    setMarketingConsent: useCallback((consent: boolean) => save(notifications.setMarketingConsent(consent)), [notifications, save]),
    setMerchantMuted: useCallback((merchantId: Id, muted: boolean) => save(notifications.setMerchantMuted(merchantId, muted)), [notifications, save]),
  };
}
