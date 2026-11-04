import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeCatalog, failing, testProduct, testVariant } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { ProductScreen, type ProductScreenProps } from './ProductScreen';
import { strings } from './strings';

const product = testProduct({
  variants: [testVariant({ id: 'm', sizeId: 'size-m' }), testVariant({ id: 'l', sizeId: 'size-l', stockQuantity: 0 })],
});

function setup(overrides: Partial<ProductScreenProps> = {}, locale: 'en' | 'ar' = 'en') {
  const cart = { addPiece: vi.fn(() => Promise.resolve()) };
  const callbacks = { onOpenBrand: vi.fn(), onOpenCart: vi.fn() };
  renderInLocale(<ProductScreen productId="p" catalog={fakeCatalog([product])} cart={cart} {...callbacks} {...overrides} />, locale);
  return { cart, ...callbacks };
}

describe('ProductScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('asks for a size before adding', async () => {
    setup();
    expect(await screen.findByRole('button', { name: 'Choose a size first' })).toBeDisabled();
  });

  it('won’t let a sold out size be chosen', async () => {
    setup();
    expect(await screen.findByRole('button', { name: 'L' })).toBeDisabled();
  });

  it('adds the chosen size to the cart, then leads there', async () => {
    const { cart, onOpenCart } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'M' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(cart.addPiece).toHaveBeenCalledWith('p', 'm', 1);
    expect(await screen.findByText('Added to your cart.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open my cart' }));
    expect(onOpenCart).toHaveBeenCalledTimes(1);
  });

  it('says when everything is sold out', async () => {
    const soldOut = testProduct({ variants: [testVariant({ stockQuantity: 0 })] });
    setup({ catalog: fakeCatalog([soldOut]) });
    expect(await screen.findByText('All sizes are sold out')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add to cart|Choose a size first/ })).not.toBeInTheDocument();
  });

  it('shows a failed add', async () => {
    setup({ cart: { addPiece: failing } });
    await userEvent.click(await screen.findByRole('button', { name: 'M' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('handles a missing piece and an error', async () => {
    setup({ productId: 'none' });
    expect(await screen.findByRole('heading', { name: 'This piece isn’t here' })).toBeInTheDocument();
  });

  it('shows an error with a way to try again', async () => {
    setup({ catalog: { ...fakeCatalog([]), getProduct: failing } });
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('speaks Arabic', async () => {
    setup({}, 'ar');
    expect(await screen.findByRole('heading', { level: 1, name: 'جاكيت أسود' })).toBeInTheDocument();
  });
});
