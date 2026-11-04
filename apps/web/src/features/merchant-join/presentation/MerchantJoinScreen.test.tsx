import { catalogProblems } from '@metaagent/i18n';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { failing, testMerchant } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { MerchantJoinScreen } from './MerchantJoinScreen';
import { strings } from './strings';

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:brand');
});

describe('MerchantJoinScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('shows what is missing and sends nothing', async () => {
    const profile = { join: vi.fn(() => Promise.resolve(testMerchant)) };
    renderInLocale(<MerchantJoinScreen profile={profile} onAddProducts={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Join and add products' }));
    expect(screen.getByRole('textbox', { name: 'Brand name' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Bio' })).toHaveAttribute('aria-invalid', 'true');
    expect(profile.join).not.toHaveBeenCalled();
  });

  it('joins with a name, an image and a bio, then leads to adding products', async () => {
    const profile = { join: vi.fn(() => Promise.resolve(testMerchant)) };
    const onAddProducts = vi.fn();
    renderInLocale(<MerchantJoinScreen profile={profile} onAddProducts={onAddProducts} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Brand name' }), ' Sawa Studio ');
    await userEvent.type(screen.getByRole('textbox', { name: 'Bio' }), 'Winter pieces');
    fireEvent.change(screen.getByLabelText('Choose your brand’s image'), { target: { files: [new File(['x'], 'b.png', { type: 'image/png' })] } });
    expect(screen.getByRole('img', { name: 'Your brand’s image' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Join and add products' }));
    expect(profile.join).toHaveBeenCalledWith({ name: 'Sawa Studio', bio: 'Winter pieces', imageUrl: 'blob:brand' });
    expect(await screen.findByRole('heading', { name: 'You’re live in the catalog' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add my first product' }));
    expect(onAddProducts).toHaveBeenCalledTimes(1);
  });

  it('refuses an image it can’t use', () => {
    renderInLocale(<MerchantJoinScreen profile={{ join: failing }} onAddProducts={() => {}} />);
    fireEvent.change(screen.getByLabelText('Choose your brand’s image'), { target: { files: [new File(['x'], 'b.pdf', { type: 'application/pdf' })] } });
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG');
  });

  it('shows a failure and keeps what was typed', async () => {
    renderInLocale(<MerchantJoinScreen profile={{ join: failing }} onAddProducts={() => {}} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Brand name' }), 'Sawa Studio');
    await userEvent.type(screen.getByRole('textbox', { name: 'Bio' }), 'Winter pieces');
    await userEvent.click(screen.getByRole('button', { name: 'Join and add products' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Brand name' })).toHaveValue('Sawa Studio');
  });

  it('asks for no login', () => {
    renderInLocale(<MerchantJoinScreen profile={{ join: failing }} onAddProducts={() => {}} />);
    expect(screen.getByText('This demo needs no login.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /password|email/i })).not.toBeInTheDocument();
  });
});
