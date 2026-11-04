import type { ScreenPreviews } from '../../core/presentation/preview';
import type { ListingFields, ListingProblem } from './domain/listing';
import { MerchantAddProductView } from './presentation/MerchantAddProductView';
import type { AddProductState } from './presentation/useMerchantAddProductViewModel';

const noop = () => {};
const photoUrl = '/brand/character.svg';
const fields: ListingFields = { nameEn: 'Black oversized jacket', nameAr: 'جاكيت أسود واسع', descriptionEn: 'A relaxed jacket.', descriptionAr: 'جاكيت واسع وهادي.', visualDescription: 'black jacket, oversized', categoryId: 'c', colorCodes: ['black'], sizes: 'S, M, L', pounds: '450', stock: '5' };
const reviewing = (problems: readonly ListingProblem[] = []): AddProductState => ({ kind: 'reviewing', photoUrl, fields, problems, saving: 'no', hasFailed: false });
const view = (state: AddProductState) => <MerchantAddProductView state={state} onPick={noop} onEdit={noop} onSave={noop} onReset={noop} onSeeProducts={noop} />;

export const previews: ScreenPreviews = {
  screen: 'Add product',
  states: [
    { name: 'Choose photos', element: view({ kind: 'choosing', problem: null }) },
    { name: 'AI reading the photo', element: view({ kind: 'reading', photoUrl }) },
    { name: 'Details to review', element: view(reviewing()) },
    { name: 'Invalid details', element: view(reviewing(['nameAr', 'pounds'])) },
    { name: 'Saved as draft', element: view({ kind: 'done', result: 'draft' }) },
    { name: 'Published', element: view({ kind: 'done', result: 'published' }) },
    { name: 'Error', element: view({ kind: 'choosing', problem: 'read' }) },
  ],
};
