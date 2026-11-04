import type { ScreenPreviews } from '../../core/presentation/preview';
import { ClientGateView } from './presentation/ClientGateView';
import type { ClientGateState } from './presentation/useClientGateViewModel';

const noop = () => {};
const view = (state: ClientGateState) => (
  <ClientGateView state={state} onConfirmAdult={noop} onConfirmMinor={noop} onBack={noop} />
);

export const previews: ScreenPreviews = {
  screen: 'Client gate',
  states: [
    { name: 'AI disclosure and age check', element: view('asking') },
    { name: 'Saving', element: view('saving') },
    { name: 'Error', element: view('failed') },
    { name: 'Under age refusal', element: view('underAge') },
  ],
};
