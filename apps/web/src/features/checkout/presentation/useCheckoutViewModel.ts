import { useCallback, useState } from 'react';
import { cartTotalPiasters } from '../../../core/domain/cart';
import type { Address, Order, OrderLimitReason } from '../../../core/domain/order';
import type { CartRepository, CatalogRepository, OrdersRepository } from '../../../core/domain/ports';

export interface CheckoutSummary {
  readonly orderCount: number;
  readonly subtotalPiasters: number;
  readonly deliveryPiasters: number;
}

export type CheckoutState =
  | { readonly kind: 'address'; readonly hasFailed: boolean }
  | { readonly kind: 'loadingSummary' }
  | { readonly kind: 'confirming'; readonly address: Address; readonly summary: CheckoutSummary }
  | { readonly kind: 'placing'; readonly address: Address; readonly summary: CheckoutSummary }
  | { readonly kind: 'placed'; readonly orders: readonly Order[] }
  | { readonly kind: 'dailyLimit'; readonly reason: OrderLimitReason }
  | { readonly kind: 'blocked' }
  | { readonly kind: 'changed' }
  | { readonly kind: 'empty' };

export function useCheckoutViewModel(
  orders: Pick<OrdersRepository, 'placeOrder'>,
  cart: Pick<CartRepository, 'listLines'>,
  catalog: Pick<CatalogRepository, 'getMerchant'>,
) {
  const [state, setState] = useState<CheckoutState>({ kind: 'address', hasFailed: false });

  const review = useCallback(
    async (address: Address) => {
      setState({ kind: 'loadingSummary' });
      try {
        const lines = await cart.listLines();
        if (lines.length === 0) {
          setState({ kind: 'empty' });
          return;
        }
        const merchantIds = [...new Set(lines.map(({ merchantId }) => merchantId))];
        const merchants = await Promise.all(merchantIds.map((id) => catalog.getMerchant(id)));
        setState({
          kind: 'confirming',
          address,
          summary: {
            orderCount: merchantIds.length,
            subtotalPiasters: cartTotalPiasters(lines),
            deliveryPiasters: merchants.reduce((total, merchant) => total + (merchant?.deliveryFeePiasters ?? 0), 0),
          },
        });
      } catch {
        setState({ kind: 'address', hasFailed: true });
      }
    },
    [cart, catalog],
  );

  const cancel = useCallback(() => setState({ kind: 'address', hasFailed: false }), []);

  const place = useCallback(async () => {
    if (state.kind !== 'confirming') {
      return;
    }
    setState({ kind: 'placing', address: state.address, summary: state.summary });
    try {
      const result = await orders.placeOrder(state.address);
      switch (result.kind) {
        case 'placed':
          setState({ kind: 'placed', orders: result.orders });
          return;
        case 'dailyLimit':
          setState({ kind: 'dailyLimit', reason: result.reason });
          return;
        default:
          setState({ kind: result.kind });
      }
    } catch {
      setState({ kind: 'address', hasFailed: true });
    }
  }, [orders, state]);

  return { state, review, cancel, place };
}
