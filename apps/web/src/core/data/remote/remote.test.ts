import { describe, expect, it, vi } from 'vitest';
import type { Product } from '../../domain/catalog';
import type { ProductSearch } from '../../domain/ports';
import type { ProductQuery } from '../../domain/search';
import { testProduct } from '../../../test/ports';
import { ApiLimitError, createApiClient } from './api';
import { firstBoxOf } from './metaResponse';
import { createRemoteProductSearch, toIndexWords, withStatedFilters } from './search';
import { createRemoteListingAssistant, createRemotePhotoToShop } from './vision';

const answer = (text: string) => ({ id: 'r', output: [{ type: 'message', content: [{ type: 'output_text', text }] }] });
const product = (id: string): Product => ({ ...testProduct(), id });
const local = (products: readonly Product[]): ProductSearch => ({
  search: vi.fn((query: ProductQuery) => Promise.resolve(query.text === undefined ? products : products.slice(0, 1))),
});

describe('search', () => {
  it('keeps the closest order from the vectors, and only what passes the filters in code', async () => {
    const search = createRemoteProductSearch(
      { search: () => Promise.resolve({ limited: false, matches: [{ id: 'b', score: 0.8 }, { id: 'over-budget', score: 0.79 }, { id: 'a', score: 0.76 }, { id: 'far', score: 0.6 }] }) },
      local([product('a'), product('b'), product('far')]),
    );
    expect((await search.search({ text: 'black jacket', maxPricePiasters: 50_000 })).map(({ id }) => id)).toEqual(['b', 'a']);
  });

  it('falls back to the filters when the vectors fail or today’s searches are used up', async () => {
    const products = [product('a')];
    const failing = createRemoteProductSearch({ search: () => Promise.reject(new Error('down')) }, local(products));
    expect(await failing.search({ text: 'x' })).toEqual(products);
    const limited = createRemoteProductSearch({ search: () => Promise.resolve({ limited: true, matches: [] }) }, local(products));
    expect(await limited.search({ text: 'x' })).toEqual(products);
  });

  it('puts a product the merchant just added first, since vectors take time to update', async () => {
    const own = product('product-new-5');
    const search = createRemoteProductSearch({ search: () => Promise.resolve({ limited: false, matches: [{ id: 'a', score: 0.9 }] }) }, { search: (query) => Promise.resolve(query.text === undefined ? [product('a'), own] : [own]) });
    expect((await search.search({ text: 'black jacket' })).map(({ id }) => id)).toEqual(['product-new-5', 'a']);
  });

  it('treats a stated color, type and budget as hard filters', async () => {
    const sent = vi.fn(() => Promise.resolve({ limited: false, matches: [] }));
    const seen: ProductQuery[] = [];
    const search = createRemoteProductSearch({ search: sent }, { search: (query) => { seen.push(query); return Promise.resolve([]); } });
    await search.search({ text: 'black jacket under 500' });
    expect(sent).toHaveBeenCalledWith({ text: 'black jacket under 500', categoryId: 'category-jackets', colorCode: 'black', maxPricePiasters: 50_000 });
    expect(seen[0]).toMatchObject({ categoryId: 'category-jackets', colorCode: 'black', maxPricePiasters: 50_000 });
  });

  it('cuts a very long description to what the backend accepts', async () => {
    const sent = vi.fn((_request: { readonly text: string }) => Promise.resolve({ limited: false, matches: [] }));
    await createRemoteProductSearch({ search: sent }, local([])).search({ text: 'soft '.repeat(200) });
    expect(sent.mock.calls[0]?.[0].text.length).toBe(300);
  });

  it('doesn’t read filters from the agent’s words, since it states them itself', async () => {
    const sent = vi.fn((_request: { readonly text: string }) => Promise.resolve({ limited: false, matches: [] }));
    await createRemoteProductSearch({ search: sent }, local([]), { readsFiltersFromWords: false }).search({ text: 'beige pants to match a black jacket' });
    expect(sent).toHaveBeenCalledWith({ text: 'beige pants to match a black jacket' });
  });

  it('measures closeness from what’s really available, so a sold out piece can’t hide the rest', async () => {
    const search = createRemoteProductSearch(
      { search: () => Promise.resolve({ limited: false, matches: [{ id: 'sold-out', score: 0.9 }, { id: 'a', score: 0.7 }] }) },
      local([product('a')]),
    );
    expect((await search.search({ text: 'soft jacket with a zip and two side pockets in black' })).map(({ id }) => id)).toEqual(['a']);
  });

  it('falls back to the filters when nothing from the vectors is available', async () => {
    const products = [product('a')];
    const search = createRemoteProductSearch({ search: () => Promise.resolve({ limited: false, matches: [{ id: 'gone', score: 0.9 }] }) }, local(products));
    expect(await search.search({ text: 'x' })).toEqual(products);
  });

  it('leaves a long description from a photo to the meaning alone', () => {
    const text = 'A black zip up bomber jacket with a shirt collar and two flap pockets';
    expect(withStatedFilters({ text })).toEqual({ text });
  });

  it('turns Arabic into the English words the index knows', () => {
    expect(toIndexWords('black jacket')).toBe('black jacket');
    expect(toIndexWords('عاوز جاكيت أسود')).toBe('black jackets');
  });
});

describe('reading SAM’s answer', () => {
  it('reads the first box as fractions of the photo', () => {
    expect(firstBoxOf('<0f>0<|box;x1=64;y1=80;x2=320;y2=400;w=640;h=800|><|mask;x=0;y=0;data=9,9,~abc|>')).toEqual({ left: 0.1, top: 0.1, right: 0.5, bottom: 0.5 });
  });

  it('treats no match as a normal answer', () => {
    expect(firstBoxOf('')).toBeNull();
  });
});

describe('photos', () => {
  const photo = { name: 'p.jpg', type: 'image/jpeg', sizeBytes: 10, previewUrl: 'blob:x' };
  const toDataUrl = () => Promise.resolve('data:image/jpeg;base64,AA');

  it('turns the AI’s reading into a draft, leaving the price to the merchant', async () => {
    const assistant = createRemoteListingAssistant(
      { readProductPhoto: () => Promise.resolve(answer(JSON.stringify({ nameEn: 'Black jeans', nameAr: 'جينز أسود', descriptionEn: 'd', descriptionAr: 'د', visualDescription: 'v', categorySlug: 'jeans', colorCode: 'black' }))) },
      toDataUrl,
    );
    expect(await assistant.readPhoto(photo)).toMatchObject({ categoryId: 'category-jeans', colorCodes: ['black'], sizeLabels: ['30', '32', '34', '36'], pricePiasters: null });
  });

  it('keeps the pieces when SAM fails on one of them', async () => {
    const gateway = createRemotePhotoToShop({
      api: {
        detectPieces: () => Promise.resolve(answer(JSON.stringify({ pieces: [{ concept: 'jacket', labelEn: 'Jacket', labelAr: 'جاكيت', description: 'd' }] }))),
        segment: () => Promise.reject(new Error('busy')),
      },
      search: local([]),
      merchantById: () => undefined,
      toDataUrl,
    });
    expect((await gateway.detectPieces(photo))[0]?.box).toEqual({ left: 0, top: 0, right: 1, bottom: 1 });
  });

  it('asks SAM about each piece Muse named, one concept at a time', async () => {
    const segment = vi.fn((_image: string, _concept: string) => Promise.resolve(answer('<0f>0<|box;x1=0;y1=0;x2=50;y2=50;w=100;h=100|>')));
    const gateway = createRemotePhotoToShop({
      api: { detectPieces: () => Promise.resolve(answer(JSON.stringify({ pieces: [{ concept: 'black jacket', labelEn: 'Jacket', labelAr: 'جاكيت', description: 'd1' }, { concept: 'blue jeans', labelEn: 'Jeans', labelAr: 'جينز', description: 'd2' }] }))), segment },
      search: local([]),
      merchantById: () => undefined,
      toDataUrl,
    });
    const pieces = await gateway.detectPieces(photo);
    expect(segment.mock.calls.map(([, concept]) => concept)).toEqual(['black jacket', 'blue jeans']);
    expect(pieces[0]?.box).toEqual({ left: 0, top: 0, right: 0.5, bottom: 0.5 });
  });
});

describe('the connection to the backend', () => {
  const ok = () => new Response(JSON.stringify({ id: 'r', output: [] }));

  it('tries once more when the connection drops', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(ok());
    const step = await createApiClient(request).agentStep({ input: [{ role: 'user', content: 'hi' }], previousResponseId: null, preferences: [], locale: 'en' });
    expect(step.id).toBe('r');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('doesn’t retry a refusal, and reports a limit', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 429 }));
    await expect(createApiClient(request).catalog()).rejects.toBeInstanceOf(ApiLimitError);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('gives every request a time limit', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(ok());
    await createApiClient(request).catalog();
    expect(request.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
