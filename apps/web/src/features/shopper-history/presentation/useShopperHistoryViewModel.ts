import { useCallback, useState } from 'react';
import type { Id } from '../../../core/domain/catalog';
import type { ShopperRecordsRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export function useShopperHistoryViewModel(records: ShopperRecordsRepository) {
  const { state, reload, refresh } = useLoadable(() => records.list(), [records]);
  const [saveFailed, setSaveFailed] = useState(false);
  const [stopping, setStopping] = useState<Id | null>(null);

  const save = useCallback(
    (change: Promise<unknown>) => {
      setSaveFailed(false);
      change.then(refresh, () => setSaveFailed(true));
    },
    [refresh],
  );

  return {
    state,
    reload,
    saveFailed,
    stopping,
    askToStop: setStopping,
    keepAccepting: useCallback(() => setStopping(null), []),
    rate: useCallback((id: Id, stars: number) => save(records.rate(id, stars)), [records, save]),
    setBlocked: useCallback(
      (id: Id, blocked: boolean) => {
        setStopping(null);
        save(records.setBlocked(id, blocked));
      },
      [records, save],
    ),
  };
}
