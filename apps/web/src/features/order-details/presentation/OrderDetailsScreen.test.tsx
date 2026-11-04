import { catalogProblems } from '@metaagent/i18n';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Order, OrderStatus } from '../../../core/domain/order';
import type { OrdersRepository } from '../../../core/domain/ports';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { OrderDetailsScreen } from './OrderDetailsScreen';
import { strings } from './strings';

const order = (status: OrderStatus, rating: Order['rating'] = null): Order => ({
  id: 'o',
  orderNumber: 'M1000',
  merchantId: 'm',
  merchantName: 'Brand',
  status,
  items: [{ id: 'i', productId: 'p', variantId: 'v', productName: { en: 'Black jacket', ar: 'جاكيت أسود' }, colorName: { en: 'Black', ar: 'أسود' }, sizeLabel: 'L', imagePath: null, unitPricePiasters: 45_000, quantity: 1, lineTotalPiasters: 45_000 }],
  subtotalPiasters: 45_000,
  deliveryFeePiasters: 5_000,
  totalPiasters: 50_000,
  address: { recipientName: 'Khaled', mobile: '01012345678', area: 'Maadi', street: 'Road 9', building: '12', floor: '', apartment: '', landmark: '', notes: '' },
  placedAt: new Date('2026-11-04T20:00:00+02:00'),
  rating,
});

function fakeOrders(initial: Order | null) {
  let current = initial;
  const listeners = new Set<() => void>();
  const repository: Pick<OrdersRepository, 'getOrder' | 'subscribe'> = {
    getOrder: () => Promise.resolve(current),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    repository,
    change: (next: Order) => {
      current = next;
      listeners.forEach((listener) => listener());
    },
  };
}

describe('OrderDetailsScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('marks the current step of the order', async () => {
    renderInLocale(<OrderDetailsScreen orderId="o" orders={fakeOrders(order('ACCEPTED')).repository} onRate={() => {}} />);
    expect((await screen.findByText('Accepted')).closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('changes live when a brand moves the order', async () => {
    const orders = fakeOrders(order('PLACED'));
    renderInLocale(<OrderDetailsScreen orderId="o" orders={orders.repository} onRate={() => {}} />);
    expect((await screen.findByText('Placed')).closest('li')).toHaveAttribute('aria-current', 'step');
    act(() => orders.change(order('OUT_FOR_DELIVERY')));
    expect((await screen.findByText('Out for delivery')).closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it.each([
    ['REJECTED', 'The brand couldn’t accept this order.'],
    ['CANCELLED', 'This order was cancelled.'],
    ['NOT_DELIVERED', 'This order wasn’t delivered.'],
  ] as const)('explains %s', async (status, message) => {
    renderInLocale(<OrderDetailsScreen orderId="o" orders={fakeOrders(order(status)).repository} onRate={() => {}} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('offers a rating only once it is delivered', async () => {
    const onRate = vi.fn();
    renderInLocale(<OrderDetailsScreen orderId="o" orders={fakeOrders(order('DELIVERED')).repository} onRate={onRate} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Rate this order' }));
    expect(onRate).toHaveBeenCalledWith('o');
  });

  it('hides the rating before delivery', async () => {
    renderInLocale(<OrderDetailsScreen orderId="o" orders={fakeOrders(order('OUT_FOR_DELIVERY')).repository} onRate={() => {}} />);
    await screen.findByText('Black jacket');
    expect(screen.queryByRole('button', { name: 'Rate this order' })).not.toBeInTheDocument();
  });

  it('shows a rating already given', async () => {
    renderInLocale(<OrderDetailsScreen orderId="o" orders={fakeOrders(order('DELIVERED', { stars: 4, comment: '' })).repository} onRate={() => {}} />);
    expect(await screen.findByText('You rated this order')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rate this order' })).not.toBeInTheDocument();
  });

  it('handles a missing order and an error', async () => {
    const first = renderInLocale(<OrderDetailsScreen orderId="o" orders={fakeOrders(null).repository} onRate={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'This order isn’t here' })).toBeInTheDocument();
    first.unmount();
    renderInLocale(<OrderDetailsScreen orderId="o" orders={{ ...fakeOrders(null).repository, getOrder: failing }} onRate={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('speaks Arabic', async () => {
    renderInLocale(<OrderDetailsScreen orderId="o" orders={fakeOrders(order('PLACED')).repository} onRate={() => {}} />, 'ar');
    expect(await screen.findByText('جاكيت أسود')).toBeInTheDocument();
  });
});
