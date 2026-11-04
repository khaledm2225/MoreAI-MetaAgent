import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ProductSearch } from '../../../core/domain/ports';
import { fakeCatalog, failing, testProduct } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { SearchScreen } from './SearchScreen';
import { strings } from './strings';
import { readBudgetPiasters } from './useSearchViewModel';

const jacketAt1000 = testProduct({ id: 'a', name: { en: 'Pricey black jacket', ar: 'غالي' }, pricePiasters: 100_000 });
const jacketAt500 = testProduct({ id: 'b', name: { en: 'Fair black jacket', ar: 'مناسب' }, pricePiasters: 50_000 });

function fakeSearch(products = [jacketAt1000, jacketAt500]): ProductSearch {
  return {
    search: (query) =>
      Promise.resolve(products.filter(({ pricePiasters }) => query.maxPricePiasters === undefined || pricePiasters <= query.maxPricePiasters)),
  };
}

function setup(search: ProductSearch, locale: 'en' | 'ar' = 'en') {
  const onOpenProduct = vi.fn();
  renderInLocale(<SearchScreen search={search} catalog={fakeCatalog([])} onOpenProduct={onOpenProduct} />, locale);
  return onOpenProduct;
}

async function find(text: string, budget = '') {
  await userEvent.type(screen.getByRole('textbox', { name: 'What are you looking for?' }), text);
  if (budget !== '') {
    await userEvent.type(screen.getByRole('textbox', { name: 'Budget in EGP (optional)' }), budget);
  }
  await userEvent.click(screen.getByRole('button', { name: 'Search' }));
}

describe('readBudgetPiasters', () => {
  it('reads whole pounds exactly', () => {
    expect(readBudgetPiasters('500')).toBe(50_000);
  });

  it('treats empty as no budget, and refuses anything else', () => {
    expect(readBudgetPiasters(' ')).toBeUndefined();
    expect(readBudgetPiasters('five')).toBeNull();
    expect(readBudgetPiasters('12.5')).toBeNull();
  });
});

describe('SearchScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings, { sameInBoth: ['budgetPlaceholder'] })).toEqual([]);
  });

  it('never shows a 1,000 EGP jacket for a 500 EGP budget', async () => {
    setup(fakeSearch());
    await find('black jacket', '500');
    expect(await screen.findByRole('button', { name: /Fair black jacket/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pricey black jacket/ })).not.toBeInTheDocument();
  });

  it('says when pieces exist but nothing is in budget', async () => {
    setup(fakeSearch([jacketAt1000]));
    await find('black jacket', '500');
    expect(await screen.findByRole('heading', { name: 'Nothing in your budget' })).toBeInTheDocument();
  });

  it('says when nothing matches', async () => {
    setup(fakeSearch([]));
    await find('spaceship');
    expect(await screen.findByRole('heading', { name: 'No results' })).toBeInTheDocument();
  });

  it('asks again for a budget it can’t read', async () => {
    const search = fakeSearch();
    const spy = vi.spyOn(search, 'search');
    setup(search);
    await find('jacket', 'cheap');
    expect(screen.getByRole('textbox', { name: 'Budget in EGP (optional)' })).toHaveAttribute('aria-invalid', 'true');
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows an error', async () => {
    setup({ search: failing });
    await find('jacket');
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
  });

  it('opens a result', async () => {
    const onOpenProduct = setup(fakeSearch());
    await find('jacket');
    await userEvent.click(await screen.findByRole('button', { name: /Fair black jacket/ }));
    expect(onOpenProduct).toHaveBeenCalledWith('b');
  });

  it('speaks Arabic', () => {
    setup(fakeSearch(), 'ar');
    expect(screen.getByRole('heading', { level: 1, name: 'دور' })).toBeInTheDocument();
  });
});
