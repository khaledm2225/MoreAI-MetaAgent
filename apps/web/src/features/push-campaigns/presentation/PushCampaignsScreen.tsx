import type { CampaignsRepository } from '../../../core/domain/ports';
import { PushCampaignsView } from './PushCampaignsView';
import { usePushCampaignsViewModel } from './usePushCampaignsViewModel';

export interface PushCampaignsScreenProps {
  readonly campaigns: CampaignsRepository;
}

export function PushCampaignsScreen({ campaigns }: PushCampaignsScreenProps) {
  const model = usePushCampaignsViewModel(campaigns);
  return (
    <PushCampaignsView
      state={model.state}
      compose={model.compose}
      onRetry={model.reload}
      onStartWriting={model.startWriting}
      onCancel={model.cancel}
      onSend={model.send}
    />
  );
}
