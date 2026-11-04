import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MerchantDashboard } from '../../../core/domain/merchant';
import type { Order } from '../../../core/domain/order';
import { failing, testMerchant } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { MerchantDashboardScreen } from './MerchantDashboardScreen';
import { strings } from './strings';

const orders = { subscribe: () => () => {} };
const dashboard = (ordersSoFar: number, ordersToday: readonly Order[] = []): MerchantDashboard => ({ merchant: testMerchant, ordersSoFar, ordersToday });

describe('MerchantDashboardScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('shows the way through the first 100 free orders', async () => {
    renderInLocale(<MerchantDashboardScreen profile={{ dashboard: () => Promise.resolve(dashboard(37)) }} orders={orders} onOpenOrders={() => {}} onAddProduct={() => {}} />);
    const bar = await screen.findByRole('progressbar', { name: 'Free orders' });
    expect(bar).toHaveAttribute('aria-valuenow', '37');
    expect(bar).toHaveAttribute('aria-valuetext', '63 free orders left, of your first 100');
  });

  it('says when there are no orders yet', async () => {
    renderInLocale(<MerchantDashboardScreen profile={{ dashboard: () => Promise.resolve(dashboard(0)) }} orders={orders} onOpenOrders={() => {}} onAddProduct={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'No orders yet' })).toBeInTheDocument();
  });

  it('lists today’s orders', async () => {
    const order = { id: 'o', orderNumber: 'M1000', status: 'PLACED', totalPiasters: 50_000 } as Order;
    renderInLocale(<MerchantDashboardScreen profile={{ dashboard: () => Promise.resolve(dashboard(1, [order])) }} orders={orders} onOpenOrders={() => {}} onAddProduct={() => {}} />);
    expect(await screen.findByText(/M1000/)).toBeInTheDocument();
  });

  it('leads to orders and adding a product', async () => {
    const onOpenOrders = vi.fn();
    const onAddProduct = vi.fn();
    renderInLocale(<MerchantDashboardScreen profile={{ dashboard: () => Promise.resolve(dashboard(0)) }} orders={orders} onOpenOrders={onOpenOrders} onAddProduct={onAddProduct} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open orders' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add a product' }));
    expect(onOpenOrders).toHaveBeenCalledTimes(1);
    expect(onAddProduct).toHaveBeenCalledTimes(1);
  });

  it('shows an error with a way to try again', async () => {
    renderInLocale(<MerchantDashboardScreen profile={{ dashboard: failing }} orders={orders} onOpenOrders={() => {}} onAddProduct={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
