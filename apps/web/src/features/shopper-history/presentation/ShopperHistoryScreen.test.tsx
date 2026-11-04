import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ShopperRecord } from '../../../core/domain/merchant';
import type { ShopperRecordsRepository } from '../../../core/domain/ports';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { ShopperHistoryScreen } from './ShopperHistoryScreen';
import { strings } from './strings';

const record: ShopperRecord = { shopperId: 's', displayName: 'Salma K.', ordersPlaced: 6, ordersReceived: 2, ordersRefused: 4, merchantRating: null, isBlocked: false };

function fake(initial: readonly ShopperRecord[]): ShopperRecordsRepository {
  let items = initial;
  const change = (id: string, patch: Partial<ShopperRecord>) => {
    items = items.map((item) => (item.shopperId === id ? { ...item, ...patch } : item));
    return Promise.resolve(items[0] as ShopperRecord);
  };
  return {
    list: () => Promise.resolve(items),
    rate: vi.fn((id: string, stars: number) => change(id, { merchantRating: stars })),
    setBlocked: vi.fn((id: string, isBlocked: boolean) => change(id, { isBlocked })),
  };
}

describe('ShopperHistoryScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('says when there are no shoppers', async () => {
    renderInLocale(<ShopperHistoryScreen records={fake([])} />);
    expect(await screen.findByRole('heading', { name: 'No shoppers yet' })).toBeInTheDocument();
  });

  it('shows the delivery record', async () => {
    renderInLocale(<ShopperHistoryScreen records={fake([record])} />);
    expect(await screen.findByText('Received 2 of 6 orders')).toBeInTheDocument();
    expect(screen.getByText('Refused 4 orders')).toBeInTheDocument();
  });

  it('rates a shopper', async () => {
    const records = fake([record]);
    renderInLocale(<ShopperHistoryScreen records={records} />);
    await userEvent.click(await screen.findByRole('radio', { name: 'Two stars' }));
    expect(records.rate).toHaveBeenCalledWith('s', 2);
  });

  it('asks before it stops accepting orders, and can undo it', async () => {
    const records = fake([record]);
    renderInLocale(<ShopperHistoryScreen records={records} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Stop accepting orders' }));
    expect(await screen.findByRole('dialog', { name: 'Stop accepting orders from Salma K.?' })).toBeInTheDocument();
    expect(records.setBlocked).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Stop accepting' }));
    expect(records.setBlocked).toHaveBeenCalledWith('s', true);
    await userEvent.click(await screen.findByRole('button', { name: 'Accept orders again' }));
    expect(records.setBlocked).toHaveBeenCalledWith('s', false);
  });

  it('shows failures', async () => {
    const first = renderInLocale(<ShopperHistoryScreen records={{ ...fake([]), list: failing }} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
    first.unmount();
    renderInLocale(<ShopperHistoryScreen records={{ ...fake([record]), rate: failing }} />);
    await userEvent.click(await screen.findByRole('radio', { name: 'One star' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
