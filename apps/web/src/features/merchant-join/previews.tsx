import type { ScreenPreviews } from '../../core/presentation/preview';
import { MerchantJoinView } from './presentation/MerchantJoinView';
import type { JoinState } from './presentation/useMerchantJoinViewModel';

const noop = () => {};
const editing = (name = false, bio = false, image = false, hasFailed = false): JoinState => ({ kind: 'editing', problems: { name, bio, image }, hasFailed });
const view = (state: JoinState, imageUrl: string | null = null) => <MerchantJoinView state={state} imageUrl={imageUrl} onPickImage={noop} onClearImage={noop} onJoin={noop} onAddProducts={noop} />;

export const previews: ScreenPreviews = {
  screen: 'Merchant join form',
  states: [
    { name: 'Brand name, bio and image', element: view(editing()) },
    { name: 'Image chosen', element: view(editing(), '/brand/character.svg') },
    { name: 'Invalid details', element: view(editing(true, true, true)) },
    { name: 'Saving', element: view({ kind: 'saving' }) },
    { name: 'Error', element: view(editing(false, false, false, true)) },
    { name: 'Live in the catalog', element: view({ kind: 'live', merchant: { id: 'm', slug: 'b', name: 'Sawa Studio', bio: { en: 'b', ar: 'ب' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 0 } }) },
  ],
};
