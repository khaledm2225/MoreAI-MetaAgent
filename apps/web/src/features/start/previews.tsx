import type { ScreenPreviews } from '../../core/presentation/preview';
import { StartScreen } from './presentation/StartScreen';

const noop = () => {};

export const previews: ScreenPreviews = {
  screen: 'First screen',
  states: [{ name: 'Two ways in', element: <StartScreen onJoinAsClient={noop} onJoinAsMerchant={noop} /> }],
};
