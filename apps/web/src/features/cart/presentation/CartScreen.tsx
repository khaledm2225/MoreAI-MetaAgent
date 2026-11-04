import type { CartRepository } from '../../../core/domain/ports';
import { CartView } from './CartView';
import { useCartViewModel } from './useCartViewModel';

export interface CartScreenProps {
  readonly cart: CartRepository;
  readonly onOpenChat: () => void;
  readonly onCheckout: () => void;
}

export function CartScreen({ cart, onOpenChat, onCheckout }: CartScreenProps) {
  const { state, reload, setQuantity, remove } = useCartViewModel(cart);
  return <CartView state={state} onRetry={reload} onSetQuantity={setQuantity} onRemove={remove} onOpenChat={onOpenChat} onCheckout={onCheckout} />;
}
