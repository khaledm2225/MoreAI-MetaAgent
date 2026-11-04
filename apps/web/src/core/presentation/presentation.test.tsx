import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInLocale } from '../../test/render';
import type { Merchant, Product } from '../domain/catalog';
import { AddressForm } from './AddressForm';
import { LanguageSwitch } from './LanguageSwitch';
import { ErrorState, LoadingState } from './LoadStates';
import { ProductCard } from './ProductCard';
import { strings } from './strings';

describe('shared words', () => {
  it('are complete in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });
});

describe('LoadingState', () => {
  it('tells screen readers it is loading', () => {
    renderInLocale(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });
});

describe('ErrorState', () => {
  it('explains the problem and lets the person try again', async () => {
    const onRetry = vi.fn();
    renderInLocale(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('speaks Arabic', () => {
    renderInLocale(<ErrorState onRetry={() => {}} />, 'ar');
    expect(screen.getByRole('alert')).toHaveTextContent('حصلت مشكلة');
  });
});

describe('LanguageSwitch', () => {
  it('moves the whole page to the other language', async () => {
    const { root } = renderInLocale(<LanguageSwitch />);
    await userEvent.click(screen.getByRole('button', { name: 'العربية' }));
    expect(root.lang).toBe('ar');
    expect(root.dir).toBe('rtl');
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
  });
});

const merchant: Merchant = {
  id: 'm',
  slug: 'brand',
  name: 'Brand',
  bio: { en: 'Bio', ar: 'نبذة' },
  logoPath: null,
  status: 'LIVE',
  deliveryFeePiasters: 5_000,
};

const product: Product = {
  id: 'p',
  merchantId: 'm',
  categoryId: 'c',
  name: { en: 'Black jacket', ar: 'جاكيت أسود' },
  description: { en: 'A jacket', ar: 'جاكيت' },
  visualDescription: 'black jacket',
  gender: 'UNISEX',
  status: 'ACTIVE',
  pricePiasters: 50_000,
  images: [{ id: 'i', path: '/jacket.jpg', alt: { en: 'A black jacket', ar: 'جاكيت أسود' }, position: 0 }],
  variants: [],
};

describe('ProductCard', () => {
  it('shows the product in the current language, with an exact price', () => {
    renderInLocale(<ProductCard product={product} merchant={merchant} onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /Black jacket/ })).toHaveTextContent('EGP');
    expect(screen.getByRole('button', { name: /Black jacket/ })).toHaveTextContent('From Brand');
  });

  it('speaks Arabic', () => {
    renderInLocale(<ProductCard product={product} merchant={merchant} onOpen={() => {}} />, 'ar');
    expect(screen.getByRole('button', { name: /جاكيت أسود/ })).toHaveTextContent('من Brand');
  });

  it('opens the product', async () => {
    const onOpen = vi.fn();
    renderInLocale(<ProductCard product={product} merchant={merchant} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('AddressForm', () => {
  it('shows what is missing and submits nothing', async () => {
    const onSubmit = vi.fn();
    renderInLocale(<AddressForm submitLabel="Continue" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Your name' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Mobile number' })).toHaveAccessibleDescription(/Egyptian mobile/);
    expect(screen.getByRole('textbox', { name: 'Floor (optional)' })).toHaveAttribute('aria-invalid', 'false');
  });

  it('submits a complete address', async () => {
    const onSubmit = vi.fn();
    renderInLocale(<AddressForm submitLabel="Continue" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Your name' }), 'Khaled');
    await userEvent.type(screen.getByRole('textbox', { name: 'Mobile number' }), '01012345678');
    await userEvent.type(screen.getByRole('textbox', { name: 'Area' }), 'Maadi');
    await userEvent.type(screen.getByRole('textbox', { name: 'Street' }), 'Road 9');
    await userEvent.type(screen.getByRole('textbox', { name: 'Building' }), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ recipientName: 'Khaled', mobile: '01012345678' }));
  });
});
