import { catalogProblems } from '@metaagent/i18n';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PhotoToShopGateway } from '../../../core/domain/ports';
import type { DetectedPiece } from '../../../core/domain/vision';
import { failing, testMerchant, testProduct } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { PhotoToShopScreen } from './PhotoToShopScreen';
import { strings } from './strings';

const jacket: DetectedPiece = { id: 'j', label: { en: 'Jacket', ar: 'جاكيت' }, box: { left: 0.1, top: 0.1, right: 0.9, bottom: 0.5 }, description: 'black jacket' };

function gateway(overrides: Partial<PhotoToShopGateway> = {}): PhotoToShopGateway {
  return {
    detectPieces: () => Promise.resolve([jacket]),
    findSimilar: () => Promise.resolve([{ product: testProduct(), merchant: testMerchant, reason: { en: 'Similar', ar: 'شبهها' } }]),
    ...overrides,
  };
}

const photo = new File(['x'], 'outfit.jpg', { type: 'image/jpeg' });

async function pickPhoto(file = photo) {
  fireEvent.change(screen.getByLabelText('Choose or take a photo'), { target: { files: [file] } });
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
});

describe('PhotoToShopScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('refuses a file that is not a photo', async () => {
    renderInLocale(<PhotoToShopScreen gateway={gateway()} onOpenProduct={() => {}} />);
    await pickPhoto(new File(['x'], 'notes.pdf', { type: 'application/pdf' }));
    expect(screen.getByRole('alert')).toHaveTextContent('isn’t a photo');
  });

  it('outlines the pieces, then finds similar ones', async () => {
    const onOpenProduct = vi.fn();
    renderInLocale(<PhotoToShopScreen gateway={gateway()} onOpenProduct={onOpenProduct} />);
    await pickPhoto();
    expect(screen.getByRole('status')).toHaveTextContent('Finding each piece');
    await userEvent.click(await screen.findByRole('button', { name: 'Jacket' }));
    expect(screen.getByRole('button', { name: 'Jacket' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(await screen.findByRole('button', { name: /Black jacket/ }));
    expect(onOpenProduct).toHaveBeenCalledWith('p');
  });

  it('shows the first piece’s matches right away, with no tap needed', async () => {
    renderInLocale(<PhotoToShopScreen gateway={gateway()} onOpenProduct={vi.fn()} />);
    await pickPhoto();
    expect(await screen.findByRole('button', { name: /Black jacket/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jacket' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('says when it finds no pieces', async () => {
    renderInLocale(<PhotoToShopScreen gateway={gateway({ detectPieces: () => Promise.resolve([]) })} onOpenProduct={() => {}} />);
    await pickPhoto();
    expect(await screen.findByRole('heading', { name: 'No pieces found' })).toBeInTheDocument();
  });

  it('says when nothing is similar', async () => {
    renderInLocale(<PhotoToShopScreen gateway={gateway({ findSimilar: () => Promise.resolve([]) })} onOpenProduct={() => {}} />);
    await pickPhoto();
    await userEvent.click(await screen.findByRole('button', { name: 'Jacket' }));
    expect(await screen.findByRole('heading', { name: 'No matches' })).toBeInTheDocument();
  });

  it('shows an error and lets the client start again', async () => {
    renderInLocale(<PhotoToShopScreen gateway={gateway({ detectPieces: failing })} onOpenProduct={() => {}} />);
    await pickPhoto();
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(screen.getByLabelText('Choose or take a photo')).toBeInTheDocument();
  });

  it('keeps the photo the same way round in Arabic', async () => {
    renderInLocale(<PhotoToShopScreen gateway={gateway()} onOpenProduct={() => {}} />, 'ar');
    fireEvent.change(screen.getByLabelText('اختار صورة أو صور'), { target: { files: [photo] } });
    const box = await screen.findByRole('button', { name: 'جاكيت' });
    expect(box.parentElement).toHaveAttribute('dir', 'ltr');
    expect(box.style.left).toBe('10%');
  });
});
