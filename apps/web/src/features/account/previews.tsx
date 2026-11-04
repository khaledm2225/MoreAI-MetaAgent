import type { Preference } from '../../core/domain/taste';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { Loadable } from '../../core/presentation/useLoadable';
import { AccountView } from './presentation/AccountView';
import type { EditState } from './presentation/useAccountViewModel';

const noop = () => {};
const items: readonly Preference[] = [
  { id: 'a', kind: 'color', text: { en: 'Likes black', ar: 'بيحب الأسود' }, source: 'agent' },
  { id: 'b', kind: 'style', text: { en: 'Likes oversized pieces', ar: 'بيحب القطع الواسعة' }, source: 'agent' },
  { id: 'c', kind: 'budget', text: { en: 'Budget around EGP 500', ar: 'الميزانية حوالي 500 جنيه' }, source: 'agent' },
];
const view = (state: Loadable<readonly Preference[]>, edit: EditState = 'viewing') => (
  <AccountView state={state} edit={edit} onRetry={noop} onStartEditing={noop} onCancelEditing={noop} onAdd={noop} onRemove={noop} onOpenOrders={noop} onOpenNotifications={noop} onOpenSettings={noop} />
);
const loaded = (value: readonly Preference[]): Loadable<readonly Preference[]> => ({ kind: 'loaded', value });

export const previews: ScreenPreviews = {
  screen: 'Account and preferences',
  states: [
    { name: 'Loading', element: view({ kind: 'loading' }) },
    { name: 'Error', element: view({ kind: 'failed' }) },
    { name: 'No preferences yet', element: view(loaded([])) },
    { name: 'Bullets animating in', element: view(loaded(items)) },
    { name: 'Editing', element: view(loaded(items), 'editing') },
    { name: 'Saved', element: view(loaded(items), 'saved') },
  ],
};
