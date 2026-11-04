import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Order } from '../../../core/domain/order';
import type { OrdersRepository } from '../../../core/domain/ports';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { RateOrderScreen } from './RateOrderScreen';
import { strings } from './strings';

const order = (status: Order['status'], rating: Order['rating'] = null) => ({ id: 'o', merchantName: 'Brand', status, rating }) as Order;

function fake(initial: Order | null): Pick<OrdersRepository, 'getOrder' | 'rateOrder'> {
  let current = initial;
  return {
    getOrder: () => Promise.resolve(current),
    rateOrder: vi.fn((_id: string, rating: NonNullable<Order['rating']>) => {
      current = order('DELIVERED', rating);
      return Promise.resolve(current);
    }),
  };
}

describe('RateOrderScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('says it isn’t available until delivered', async () => {
    renderInLocale(<RateOrderScreen orderId="o" orders={fake(order('ACCEPTED'))} onBack={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'Not available yet' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('asks for a rating first, then sends it once', async () => {
    const orders = fake(order('DELIVERED'));
    renderInLocale(<RateOrderScreen orderId="o" orders={orders} onBack={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Choose a rating first' })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Great' }));
    await userEvent.type(screen.getByRole('textbox'), ' Lovely ');
    await userEvent.click(screen.getByRole('button', { name: 'Send my rating' }));
    expect(orders.rateOrder).toHaveBeenCalledWith('o', { stars: 5, comment: 'Lovely' });
    expect(await screen.findByRole('heading', { name: 'You already rated this order' })).toBeInTheDocument();
  });

  it('won’t rate an order twice', async () => {
    renderInLocale(<RateOrderScreen orderId="o" orders={fake(order('DELIVERED', { stars: 3, comment: '' }))} onBack={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'You already rated this order' })).toBeInTheDocument();
  });

  it('shows a failed rating', async () => {
    renderInLocale(<RateOrderScreen orderId="o" orders={{ ...fake(order('DELIVERED')), rateOrder: failing }} onBack={() => {}} />);
    await userEvent.click(await screen.findByRole('radio', { name: 'Good' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send my rating' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('goes back', async () => {
    const onBack = vi.fn();
    renderInLocale(<RateOrderScreen orderId="o" orders={fake(null)} onBack={onBack} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Back to my orders' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
