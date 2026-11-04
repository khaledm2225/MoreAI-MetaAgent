import { useCallback, useState } from 'react';
import type { Campaign, CampaignAudience } from '../../../core/domain/merchant';
import type { CampaignsRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export interface CampaignsData {
  readonly campaigns: readonly Campaign[];
  readonly audience: CampaignAudience;
}

export type ComposeState = 'closed' | 'writing' | 'invalid' | 'sending' | 'failed';

export function usePushCampaignsViewModel(campaigns: CampaignsRepository) {
  const { state, reload, refresh } = useLoadable<CampaignsData>(
    async () => {
      const [list, audience] = await Promise.all([campaigns.list(), campaigns.audience()]);
      return { campaigns: list, audience };
    },
    [campaigns],
  );
  const [compose, setCompose] = useState<ComposeState>('closed');

  const send = useCallback(
    (title: string, body: string) => {
      if (title.trim() === '' || body.trim() === '') {
        setCompose('invalid');
        return;
      }
      setCompose('sending');
      campaigns.send(title.trim(), body.trim()).then(
        () => {
          setCompose('closed');
          refresh();
        },
        () => setCompose('failed'),
      );
    },
    [campaigns, refresh],
  );

  return { state, reload, compose, startWriting: useCallback(() => setCompose('writing'), []), cancel: useCallback(() => setCompose('closed'), []), send };
}
