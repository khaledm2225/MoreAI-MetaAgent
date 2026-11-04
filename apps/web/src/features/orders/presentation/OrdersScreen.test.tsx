import { catalogProblems } from '@metaagent/i18n';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Order } from '../../../core/domain/order';
import type { OrdersRepository } from '../../../core/domain/ports';
import { orderStatusStrings } from '../../../core/presentation/orderStatusStrings';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { OrdersScreen } from './OrdersScreen';
import { strings } from './strings';

const order = (id: string, status: Order['status'], merchantName = 'Brand'): Order => ({
  id,
  orderNumber: `M${id}`,
  merchantId: 'm',
  merchantName,
  status,
  items: [{ id: 'i', productId: 'p', variantId: 'v', productName: { en: 'Jacket', ar: 'جاكيت' }, colorName: { en: 'Black', ar: 'أسود' }, sizeLabel: 'L', imagePath: null, unitPricePiasters: 45_000, quantity: 2, lineTotalPiasters: 90_000 }],
  subtotalPiasters: 90_000,
  deliveryFeePiasters: 5_000,
  totalPiasters: 95_000,
  address: { recipientName: 'Khaled', mobile: '01012345678', area: 'Maadi', street: 'Road 9', building: '12', floor: '', apartment: '', landmark: '', notes: '' },
  placedAt: new Date('2026-11-04T20:00:00+02:00'),
  rating: null,
});

function fakeOrders(initial: readonly Order[]) {
  let items = initial;
  const listeners = new Set<() => void>();
  const repository: Pick<OrdersRepository, 'listOrders' | 'subscribe'> = {
    listOrders: () => Promise.resolve(items),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    repository,
    change: (next: readonly Order[]) => {
      items = next;
      listeners.forEach((listener) => listener());
    },
  };
}

describe('OrdersScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
    expect(catalogProblems(orderStatusStrings)).toEqual([]);
  });

  it('invites the client to shop when empty', async () => {
    const onOpenChat = vi.fn();
    renderInLocale(<OrdersScreen orders={fakeOrders([]).repository} onOpenOrder={() => {}} onOpenChat={onOpenChat} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Ask MoreAI' }));
    expect(onOpenChat).toHaveBeenCalledTimes(1);
  });

  it('separates active orders from past ones, and opens one', async () => {
    const onOpenOrder = vi.fn();
    renderInLocale(<OrdersScreen orders={fakeOrders([order('1', 'ACCEPTED'), order('2', 'DELIVERED')]).repository} onOpenOrder={onOpenOrder} onOpenChat={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Past' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /M1/ }));
    expect(onOpenOrder).toHaveBeenCalledWith('1');
  });

  it('updates live when a brand changes an order', async () => {
    const orders = fakeOrders([order('1', 'PLACED')]);
    renderInLocale(<OrdersScreen orders={orders.repository} onOpenOrder={() => {}} onOpenChat={() => {}} />);
    await screen.findByText('Placed');
    act(() => orders.change([order('1', 'ACCEPTED')]));
    expect(await screen.findByText('Accepted')).toBeInTheDocument();
  });

  it('shows an error with a way to try again', async () => {
    renderInLocale(<OrdersScreen orders={{ ...fakeOrders([]).repository, listOrders: failing }} onOpenOrder={() => {}} onOpenChat={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('counts pieces in Arabic', async () => {
    renderInLocale(<OrdersScreen orders={fakeOrders([order('1', 'PLACED')]).repository} onOpenOrder={() => {}} onOpenChat={() => {}} />, 'ar');
    const button = await screen.findByRole('button', { name: /M1/ });
    expect(within(button).getByText(/قطعتين/)).toBeInTheDocument();
  });
});

