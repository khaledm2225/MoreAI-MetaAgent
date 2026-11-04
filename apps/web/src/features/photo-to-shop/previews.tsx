import type { DetectedPiece } from '../../core/domain/vision';
import type { ScreenPreviews } from '../../core/presentation/preview';
import { PhotoToShopView } from './presentation/PhotoToShopView';
import type { PhotoToShopState } from './presentation/usePhotoToShopViewModel';

const noop = () => {};
const photoUrl = '/brand/character.svg';
const piece: DetectedPiece = { id: 'j', label: { en: 'Jacket', ar: 'جاكيت' }, box: { left: 0.15, top: 0.1, right: 0.85, bottom: 0.6 }, description: 'black jacket' };
const merchant = { id: 'm', slug: 'b', name: 'Sawa Studio', bio: { en: 'b', ar: 'ب' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 0 } as const;
const product = { id: 'p', merchantId: 'm', categoryId: 'c', name: { en: 'Black jacket', ar: 'جاكيت أسود' }, description: { en: 'd', ar: 'د' }, visualDescription: 'v', gender: 'UNISEX', status: 'ACTIVE', pricePiasters: 45_000, images: [], variants: [] } as const;
const view = (state: PhotoToShopState) => <PhotoToShopView state={state} onPick={noop} onSelectPiece={noop} onReset={noop} onOpenProduct={noop} />;

export const previews: ScreenPreviews = {
  screen: 'Photo to shop',
  states: [
    { name: 'Choose photo', element: view({ kind: 'choosing', problem: null }) },
    { name: 'Invalid photo', element: view({ kind: 'choosing', problem: 'wrongType' }) },
    { name: 'Outlining pieces', element: view({ kind: 'outlining', photoUrl }) },
    { name: 'No pieces found', element: view({ kind: 'noPieces', photoUrl }) },
    { name: 'Piece to select', element: view({ kind: 'pieces', photoUrl, pieces: [piece], selectedId: null, similar: 'idle' }) },
    { name: 'Similar pieces', element: view({ kind: 'pieces', photoUrl, pieces: [piece], selectedId: 'j', similar: [{ product, merchant, reason: { en: 'Similar to the jacket in your photo.', ar: 'شبه الجاكيت اللي في صورتك.' } }] }) },
    { name: 'No matches', element: view({ kind: 'pieces', photoUrl, pieces: [piece], selectedId: 'j', similar: [] }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
  ],
};
