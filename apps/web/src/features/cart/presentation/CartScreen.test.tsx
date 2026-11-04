import { catalogProblems } from '@metaagent/i18n';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CartLine } from '../../../core/domain/cart';
import type { CartRepository } from '../../../core/domain/ports';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { CartScreen } from './CartScreen';
import { strings } from './strings';

function line(overrides: Partial<CartLine> = {}): CartLine {
  return { id: 'l', productId: 'p', variantId: 'v', merchantId: 'm', merchantName: 'Brand A', productName: { en: 'Black jacket', ar: 'جاكيت أسود' }, colorName: { en: 'Black', ar: 'أسود' }, sizeLabel: 'L', imagePath: null, unitPricePiasters: 50_000, quantity: 1, availability: 'available', previousUnitPricePiasters: null, ...overrides };
}

function fakeCart(lines: readonly CartLine[]): CartRepository {
  return { listLines: () => Promise.resolve(lines), addPiece: vi.fn(() => Promise.resolve()), setQuantity: vi.fn(() => Promise.resolve()), removeLine: vi.fn(() => Promise.resolve()), subscribe: () => () => {} };
}

function setup(cart: CartRepository, locale: 'en' | 'ar' = 'en') {
  const callbacks = { onOpenChat: vi.fn(), onCheckout: vi.fn() };
  renderInLocale(<CartScreen cart={cart} {...callbacks} />, locale);
  return callbacks;
}

describe('CartScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('invites the client to ask MoreAI when empty', async () => {
    const { onOpenChat } = setup(fakeCart([]));
    await userEvent.click(await screen.findByRole('button', { name: 'Ask MoreAI' }));
    expect(onOpenChat).toHaveBeenCalledTimes(1);
  });

  it('groups pieces by brand, with an exact total', async () => {
    setup(fakeCart([line({ id: '1', quantity: 2 }), line({ id: '2', merchantId: 'n', merchantName: 'Brand B', unitPricePiasters: 19_999 })]));
    expect(await screen.findByRole('region', { name: 'Brand A' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Brand B' })).toBeInTheDocument();
    expect(screen.getByText(/EGP.1,199\.99/)).toBeInTheDocument();
  });

  it('changes quantity and removes', async () => {
    const cart = fakeCart([line()]);
    setup(cart);
    await userEvent.click(await screen.findByRole('button', { name: 'One more' }));
    expect(cart.setQuantity).toHaveBeenCalledWith('l', 2);
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(cart.removeLine).toHaveBeenCalledWith('l');
  });

  it('stops checkout while a piece is sold out', async () => {
    setup(fakeCart([line({ availability: 'soldOut' })]));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sold out');
    expect(screen.getByRole('button', { name: 'Remove what’s sold out to continue' })).toBeDisabled();
  });

  it('tells the client when a price changed', async () => {
    setup(fakeCart([line({ previousUnitPricePiasters: 40_000 })]));
    const status = await screen.findByText(/The price changed from/);
    expect(status).toHaveTextContent('400');
  });

  it('continues to checkout', async () => {
    const { onCheckout } = setup(fakeCart([line()]));
    await userEvent.click(await screen.findByRole('button', { name: 'Go to checkout' }));
    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it('shows an error with a way to try again', async () => {
    setup({ ...fakeCart([]), listLines: failing });
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('speaks Arabic, calling the cart الأوردر', async () => {
    setup(fakeCart([line()]), 'ar');
    const region = await screen.findByRole('region', { name: 'Brand A' });
    expect(within(region).getByText('جاكيت أسود')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'الأوردر' })).toBeInTheDocument();
  });
});
