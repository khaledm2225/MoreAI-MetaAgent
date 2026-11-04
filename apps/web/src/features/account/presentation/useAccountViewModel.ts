import { useCallback, useEffect, useState } from 'react';
import type { Id } from '../../../core/domain/catalog';
import type { PreferencesRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export type EditState = 'viewing' | 'editing' | 'saving' | 'saved' | 'failed';

export function useAccountViewModel(preferences: PreferencesRepository) {
  const { state, reload, refresh } = useLoadable(() => preferences.list(), [preferences]);
  const [edit, setEdit] = useState<EditState>('viewing');

  // A preference the agent learns elsewhere pops in here live.
  useEffect(() => preferences.subscribe(refresh), [preferences, refresh]);

  const startEditing = useCallback(() => setEdit('editing'), []);
  const cancelEditing = useCallback(() => setEdit('viewing'), []);

  const add = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed === '') {
        return;
      }
      setEdit('saving');
      preferences.add({ kind: 'style', text: { en: trimmed, ar: trimmed } }).then(
        () => setEdit('saved'),
        () => setEdit('failed'),
      );
    },
    [preferences],
  );

  const remove = useCallback(
    (id: Id) => {
      preferences.remove(id).catch(() => setEdit('failed'));
    },
    [preferences],
  );

  return { state, reload, edit, startEditing, cancelEditing, add, remove };
}
