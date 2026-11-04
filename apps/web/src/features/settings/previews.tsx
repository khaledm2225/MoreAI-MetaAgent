import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { SettingsView } from './presentation/SettingsView';
import type { SettingsData } from './presentation/useSettingsViewModel';

const noop = () => {};
const data: SettingsData = { settings: { showMoreAiButton: true }, notifications: { marketingConsent: false, mutedMerchantIds: [] } };
const view = (state: Loadable<SettingsData>, isConfirmingDelete = false) => (
  <SettingsView state={state} saveFailed={false} isConfirmingDelete={isConfirmingDelete} isDeleting={false} onRetry={noop} onSetShowMoreAi={noop} onSetMarketing={noop} onAskToDelete={noop} onKeepAccount={noop} onDeleteAccount={noop} />
);

export const previews: ScreenPreviews = {
  screen: 'Settings',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Language, MoreAI and marketing', element: view({ kind: 'loaded', value: data }) },
    { name: 'Delete account', element: view({ kind: 'loaded', value: data }, true) },
  ],
};
