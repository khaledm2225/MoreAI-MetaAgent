import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeCatalog, failing, testProduct } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { BrowseScreen } from './BrowseScreen';
import { strings } from './strings';
import { PAGE_SIZE } from './useBrowseViewModel';

describe('BrowseScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('shows brands and products, and opens them', async () => {
    const onOpenBrand = vi.fn();
    const onOpenProduct = vi.fn();
    renderInLocale(<BrowseScreen catalog={fakeCatalog([testProduct()])} onOpenBrand={onOpenBrand} onOpenProduct={onOpenProduct} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Brand' }));
    expect(onOpenBrand).toHaveBeenCalledWith('m');
    await userEvent.click(screen.getByRole('button', { name: /Black jacket/ }));
    expect(onOpenProduct).toHaveBeenCalledWith('p');
  });

  it('says when there are no products yet', async () => {
    renderInLocale(<BrowseScreen catalog={fakeCatalog([])} onOpenBrand={() => {}} onOpenProduct={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'No products yet' })).toBeInTheDocument();
  });

  it('filters by category', async () => {
    const other = testProduct({ id: 'x', categoryId: 'other', name: { en: 'Other piece', ar: 'قطعة' } });
    renderInLocale(<BrowseScreen catalog={fakeCatalog([testProduct(), other])} onOpenBrand={() => {}} onOpenProduct={() => {}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Jackets' }));
    expect(screen.queryByRole('button', { name: /Other piece/ })).not.toBeInTheDocument();
  });

  it('shows more on request', async () => {
    const many = Array.from({ length: PAGE_SIZE + 1 }, (_, index) => testProduct({ id: `p${String(index)}` }));
    renderInLocale(<BrowseScreen catalog={fakeCatalog(many)} onOpenBrand={() => {}} onOpenProduct={() => {}} />);
    expect(await screen.findAllByRole('article')).toHaveLength(PAGE_SIZE);
    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getAllByRole('article')).toHaveLength(PAGE_SIZE + 1);
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('shows an error with a way to try again', async () => {
    const catalog = { ...fakeCatalog([]), listMerchants: failing };
    renderInLocale(<BrowseScreen catalog={catalog} onOpenBrand={() => {}} onOpenProduct={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('speaks Arabic, with his wording', async () => {
    renderInLocale(<BrowseScreen catalog={fakeCatalog([testProduct()])} onOpenBrand={() => {}} onOpenProduct={() => {}} />, 'ar');
    expect(await screen.findByText('كل ال Local brands في مكان واحد.')).toBeInTheDocument();
  });
});
