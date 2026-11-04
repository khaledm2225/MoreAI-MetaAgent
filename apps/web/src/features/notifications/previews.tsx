import type { AppNotification } from '../../core/domain/account';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { NotificationsView } from './presentation/NotificationsView';
import type { NotificationsData } from './presentation/useNotificationsViewModel';

const noop = () => {};
const item: AppNotification = { id: 'n', merchantId: 'm', merchantName: 'Sawa Studio', kind: 'order', title: { en: 'Order placed', ar: 'الأوردر اتطلب' }, body: { en: 'Sawa Studio received your order.', ar: 'Sawa Studio استلم الأوردر.' }, createdAt: new Date('2026-11-04T20:00:00+02:00'), isRead: false };
const view = (state: Loadable<NotificationsData>) => <NotificationsView state={state} saveFailed={false} onRetry={noop} onSetMarketingConsent={noop} onSetMerchantMuted={noop} />;
const loaded = (items: readonly AppNotification[], marketingConsent = false, mutedMerchantIds: readonly string[] = []): Loadable<NotificationsData> => ({ kind: 'loaded', value: { items, preferences: { marketingConsent, mutedMerchantIds } } });

export const previews: ScreenPreviews = {
  screen: 'Notifications',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Empty', element: view(loaded([])) },
    { name: 'List', element: view(loaded([item])) },
    { name: 'Marketing consent', element: view(loaded([item], true)) },
    { name: 'Muted brand', element: view(loaded([item], true, ['m'])) },
  ],
};
