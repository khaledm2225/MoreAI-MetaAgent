import { catalogProblems } from '@metaagent/i18n';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListingAssistant } from '../../../core/domain/ports';
import { failing, testProduct } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { MerchantAddProductScreen, type MerchantAddProductScreenProps } from './MerchantAddProductScreen';
import { strings } from './strings';

const assistant: ListingAssistant = {
  readPhoto: () =>
    Promise.resolve({
      name: { en: 'Black jacket', ar: 'جاكيت أسود' },
      description: { en: 'Warm', ar: 'دافي' },
      visualDescription: 'black jacket',
      categoryId: 'c',
      colorCodes: ['black'],
      sizeLabels: ['S', 'M'],
      pricePiasters: null,
    }),
};

function setup(overrides: Partial<MerchantAddProductScreenProps> = {}) {
  const products = { saveDraft: vi.fn(() => Promise.resolve(testProduct())), publish: vi.fn(() => Promise.resolve(testProduct())) };
  const onSeeProducts = vi.fn();
  renderInLocale(<MerchantAddProductScreen assistant={assistant} products={products} onSeeProducts={onSeeProducts} {...overrides} />);
  return { products, onSeeProducts };
}

const choose = (file = new File(['x'], 'p.jpg', { type: 'image/jpeg' })) =>
  fireEvent.change(screen.getByLabelText('Choose a product photo'), { target: { files: [file] } });

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:product');
});

describe('MerchantAddProductScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('refuses a file it can’t use', () => {
    setup();
    choose(new File(['x'], 'p.pdf', { type: 'application/pdf' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG');
  });

  it('shows the AI reading, then the details to review, with nothing saved yet', async () => {
    const { products } = setup();
    choose();
    expect(screen.getByRole('status')).toHaveTextContent('The AI is reading your photo');
    expect(await screen.findByRole('textbox', { name: 'Name in English' })).toHaveValue('Black jacket');
    expect(products.publish).not.toHaveBeenCalled();
    expect(products.saveDraft).not.toHaveBeenCalled();
  });

  it('stops invalid details, since the AI leaves the price to the merchant', async () => {
    const { products } = setup();
    choose();
    await screen.findByRole('textbox', { name: 'Name in English' });
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(screen.getByRole('textbox', { name: 'Price in EGP' })).toHaveAttribute('aria-invalid', 'true');
    expect(products.publish).not.toHaveBeenCalled();
  });

  it('publishes only when the merchant approves, with what they edited', async () => {
    const { products, onSeeProducts } = setup();
    choose();
    const name = await screen.findByRole('textbox', { name: 'Name in English' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Night jacket');
    await userEvent.type(screen.getByRole('textbox', { name: 'Price in EGP' }), '450');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(products.publish).toHaveBeenCalledWith(expect.objectContaining({ pricePiasters: 45_000, name: { en: 'Night jacket', ar: 'جاكيت أسود' } }));
    expect(await screen.findByText('Published. Shoppers can find it now.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'See my products' }));
    expect(onSeeProducts).toHaveBeenCalledTimes(1);
  });

  it('can save a draft instead', async () => {
    const { products } = setup();
    choose();
    await screen.findByRole('textbox', { name: 'Name in English' });
    await userEvent.type(screen.getByRole('textbox', { name: 'Price in EGP' }), '450');
    await userEvent.click(screen.getByRole('button', { name: 'Save as draft' }));
    expect(products.saveDraft).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Saved as a draft. It isn’t live yet.')).toBeInTheDocument();
  });

  it('says when the AI can’t read a photo', async () => {
    setup({ assistant: { readPhoto: failing } });
    choose();
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t read this photo');
  });

  it('shows a failed save and keeps the details', async () => {
    setup({ products: { saveDraft: failing, publish: failing } });
    choose();
    await screen.findByRole('textbox', { name: 'Name in English' });
    await userEvent.type(screen.getByRole('textbox', { name: 'Price in EGP' }), '450');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Price in EGP' })).toHaveValue('450');
  });
});
