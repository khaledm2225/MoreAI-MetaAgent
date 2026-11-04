import { useCallback, useEffect } from 'react';
import type { Id } from '../../../core/domain/catalog';
import type { CartRepository } from '../../../core/domain/ports';
import { useLoadable } from '../../../core/presentation/useLoadable';

export function useCartViewModel(cart: CartRepository) {
  const { state, reload, refresh } = useLoadable(() => cart.listLines(), [cart]);

  useEffect(() => cart.subscribe(refresh), [cart, refresh]);

  const setQuantity = useCallback((lineId: Id, quantity: number) => void cart.setQuantity(lineId, quantity), [cart]);
  const remove = useCallback((lineId: Id) => void cart.removeLine(lineId), [cart]);

  return { state, reload, setQuantity, remove };
}
