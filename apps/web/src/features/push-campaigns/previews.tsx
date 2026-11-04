import type { Campaign, CampaignAudience } from '../../core/domain/merchant';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { PushCampaignsView } from './presentation/PushCampaignsView';
import type { CampaignsData, ComposeState } from './presentation/usePushCampaignsViewModel';

const noop = () => {};
const audience: CampaignAudience = { followers: 120, buyers: 48, withConsent: 86 };
const campaign: Campaign = { id: 'c', title: 'New drop', body: 'Winter jackets are here', status: 'sent', audienceSize: 86, opens: 43, orders: 3, sentAt: new Date('2026-11-04T20:00:00+02:00') };
const loaded = (campaigns: readonly Campaign[], withConsent = 86): Loadable<CampaignsData> => ({ kind: 'loaded', value: { campaigns, audience: { ...audience, withConsent } } });
const view = (state: Loadable<CampaignsData>, compose: ComposeState = 'closed') => <PushCampaignsView state={state} compose={compose} onRetry={noop} onStartWriting={noop} onCancel={noop} onSend={noop} />;

export const previews: ScreenPreviews = {
  screen: 'Push campaigns',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'Empty', element: view(loaded([])) },
    { name: 'Writing', element: view(loaded([]), 'writing') },
    { name: 'Audience without consent', element: view(loaded([], 0)) },
    { name: 'Sent, with results', element: view(loaded([campaign])) },
  ],
};
