import type { CartRepository, CatalogRepository, OrdersRepository } from '../../../core/domain/ports';
import { CheckoutView } from './CheckoutView';
import { useCheckoutViewModel } from './useCheckoutViewModel';

export interface CheckoutScreenProps {
  readonly orders: Pick<OrdersRepository, 'placeOrder'>;
  readonly cart: Pick<CartRepository, 'listLines'>;
  readonly catalog: Pick<CatalogRepository, 'getMerchant'>;
  readonly onOpenOrders: () => void;
  readonly onOpenCart: () => void;
}

export function CheckoutScreen({ orders, cart, catalog, onOpenOrders, onOpenCart }: CheckoutScreenProps) {
  const { state, review, cancel, place } = useCheckoutViewModel(orders, cart, catalog);
  return (
    <CheckoutView
      state={state}
      onReview={(address) => void review(address)}
      onCancel={cancel}
      onPlace={() => void place()}
      onOpenOrders={onOpenOrders}
      onOpenCart={onOpenCart}
    />
  );
}
