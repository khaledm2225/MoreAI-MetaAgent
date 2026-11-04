import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '../../../core/domain/catalog';
import { failing, testProduct } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { MerchantProductsScreen } from './MerchantProductsScreen';
import { strings } from './strings';

function fake(initial: readonly Product[]) {
  let items = initial;
  return {
    list: () => Promise.resolve(items),
    setStatus: vi.fn((id: string, status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED') => {
      items = items.map((item) => (item.id === id ? { ...item, status } : item));
      return Promise.resolve(items[0] as Product);
    }),
  };
}

describe('MerchantProductsScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('invites the merchant to add the first product', async () => {
    const onAdd = vi.fn();
    renderInLocale(<MerchantProductsScreen products={fake([])} onAdd={onAdd} />);
    expect(await screen.findByRole('heading', { name: 'No products yet' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add a product' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('separates products by status', async () => {
    renderInLocale(<MerchantProductsScreen products={fake([testProduct({ id: 'a', name: { en: 'Live piece', ar: 'شغال' } }), testProduct({ id: 'b', status: 'DRAFT', name: { en: 'Draft piece', ar: 'مسودة' } })])} onAdd={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'Live piece' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Draft piece' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Draft' }));
    expect(screen.getByRole('heading', { name: 'Draft piece' })).toBeInTheDocument();
  });

  it('hides a live product', async () => {
    const products = fake([testProduct()]);
    renderInLocale(<MerchantProductsScreen products={products} onAdd={() => {}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Hide' }));
    expect(products.setStatus).toHaveBeenCalledWith('p', 'HIDDEN');
    expect(await screen.findByText('Nothing here right now.')).toBeInTheDocument();
  });

  it('shows a failed save', async () => {
    renderInLocale(<MerchantProductsScreen products={{ ...fake([testProduct()]), setStatus: failing }} onAdd={() => {}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Archive' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows an error with a way to try again', async () => {
    renderInLocale(<MerchantProductsScreen products={{ ...fake([]), list: failing }} onAdd={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
