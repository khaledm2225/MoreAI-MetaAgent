import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Order, OrderStatus } from '../../../core/domain/order';
import type { MerchantOrdersRepository } from '../../../core/domain/ports';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { MerchantOrdersScreen } from './MerchantOrdersScreen';
import { strings } from './strings';

const order = (id: string, status: OrderStatus): Order => ({
  id,
  orderNumber: `M${id}`,
  merchantId: 'm',
  merchantName: 'Brand',
  status,
  items: [{ id: 'i', productId: 'p', variantId: 'v', productName: { en: 'Jacket', ar: 'جاكيت' }, colorName: { en: 'Black', ar: 'أسود' }, sizeLabel: 'L', imagePath: null, unitPricePiasters: 45_000, quantity: 1, lineTotalPiasters: 45_000 }],
  subtotalPiasters: 45_000,
  deliveryFeePiasters: 5_000,
  totalPiasters: 50_000,
  address: { recipientName: 'Khaled', mobile: '01012345678', area: 'Maadi', street: 'Road 9', building: '12', floor: '', apartment: '', landmark: '', notes: '' },
  placedAt: new Date('2026-11-04T20:00:00+02:00'),
  rating: null,
});

function fake(initial: readonly Order[]) {
  let items = initial;
  const listeners = new Set<() => void>();
  const repository: MerchantOrdersRepository = {
    list: () => Promise.resolve(items),
    moveOrder: vi.fn((id: string, status: OrderStatus) => {
      items = items.map((item) => (item.id === id ? { ...item, status } : item));
      listeners.forEach((listener) => listener());
      return Promise.resolve(items[0] as Order);
    }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return repository;
}

describe('MerchantOrdersScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings, { sameInBoth: ['pieces'] })).toEqual([]);
  });

  it('says when there are no orders', async () => {
    renderInLocale(<MerchantOrdersScreen orders={fake([])} />);
    expect(await screen.findByRole('heading', { name: 'No orders yet' })).toBeInTheDocument();
  });

  it('accepts a new order, which moves it along', async () => {
    const orders = fake([order('1', 'PLACED')]);
    renderInLocale(<MerchantOrdersScreen orders={orders} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(orders.moveOrder).toHaveBeenCalledWith('1', 'ACCEPTED');
    expect(await screen.findByText('Nothing here right now.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'In progress' }));
    expect(await screen.findByRole('button', { name: 'Out for delivery' })).toBeInTheDocument();
  });

  it('asks before rejecting', async () => {
    const orders = fake([order('1', 'PLACED')]);
    renderInLocale(<MerchantOrdersScreen orders={orders} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));
    expect(await screen.findByRole('dialog', { name: 'Reject this order?' })).toBeInTheDocument();
    expect(orders.moveOrder).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Keep the order' }));
    expect(orders.moveOrder).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reject the order' }));
    expect(orders.moveOrder).toHaveBeenCalledWith('1', 'REJECTED');
  });

  it('offers no moves on a finished order', async () => {
    renderInLocale(<MerchantOrdersScreen orders={fake([order('1', 'DELIVERED')])} />);
    await userEvent.click(await screen.findByRole('tab', { name: 'Finished' }));
    expect(await screen.findByText('Delivered')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Accept|Reject/ })).not.toBeInTheDocument();
  });

  it('shows a failed save', async () => {
    renderInLocale(<MerchantOrdersScreen orders={{ ...fake([order('1', 'PLACED')]), moveOrder: failing }} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows an error with a way to try again', async () => {
    renderInLocale(<MerchantOrdersScreen orders={{ ...fake([]), list: failing }} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
