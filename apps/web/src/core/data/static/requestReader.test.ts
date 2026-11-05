import { describe, expect, it } from 'vitest';
import { readShopperRequest, readStatedFilters } from './requestReader';

describe('readShopperRequest', () => {
  it.each([
    ['I need a black jacket under 500', { categorySlug: 'jackets', colorCode: 'black', maxPricePiasters: 50_000 }],
    ['جاكيت أسود في حدود 500 جنيه', { categorySlug: 'jackets', colorCode: 'black', maxPricePiasters: 50_000 }],
    ['محتاج جاكيت اسود', { categorySlug: 'jackets', colorCode: 'black' }],
    ['a beige hoodie, up to 1,200 EGP', { categorySlug: 'hoodies', colorCode: 'beige', maxPricePiasters: 120_000 }],
    ['عاوز هودي كحلي بـ ٨٠٠ جنيه', { categorySlug: 'hoodies', colorCode: 'navy', maxPricePiasters: 80_000 }],
  ])('reads "%s"', (text, expected) => {
    expect(readShopperRequest(text)).toMatchObject(expected);
  });

  it('reads a style', () => {
    expect(readShopperRequest('something oversized')).toMatchObject({ styleWord: 'oversized' });
    expect(readShopperRequest('حاجة واسعة')).toMatchObject({ styleWord: 'oversized' });
  });

  it('notices when the shopper wants to check out', () => {
    expect(readShopperRequest('checkout please').wantsCheckout).toBe(true);
    expect(readShopperRequest('اطلب الأوردر').wantsCheckout).toBe(true);
    expect(readShopperRequest('a jacket').wantsCheckout).toBe(false);
  });

  it('never treats a size as a budget', () => {
    expect(readShopperRequest('jeans size 32').maxPricePiasters).toBeUndefined();
  });

  it('reads nothing from a plain greeting', () => {
    expect(readShopperRequest('hello')).toEqual({ wantsCheckout: false });
  });

  it('doesn’t read a fabric percentage or a year as a budget', () => {
    expect(readShopperRequest('a 100% cotton hoodie').maxPricePiasters).toBeUndefined();
    expect(readShopperRequest('the 2026 black jacket').maxPricePiasters).toBeUndefined();
    expect(readShopperRequest('a jacket under 2,000 EGP').maxPricePiasters).toBe(200_000);
  });

  it('matches English words whole', () => {
    expect(readShopperRequest('something baggy').categorySlug).toBeUndefined();
    expect(readShopperRequest('two bags').categorySlug).toBe('bags');
    expect(readShopperRequest('a dressy top').categorySlug).toBeUndefined();
  });

  it.each([
    ['jacket size 52'],
    ['hoodie over 1000'],
    ['jacket between 800 and 1000'],
    ['a jacket at least 900 pounds'],
  ])('doesn’t read "%s" as a limit on the price', (text) => {
    expect(readShopperRequest(text).maxPricePiasters).toBeUndefined();
  });

  it.each([
    ['hoodie, not black', { categorySlug: 'hoodies' }],
    ['black or navy hoodie', { categorySlug: 'hoodies' }],
    ['beige pants to match a black jacket', {}],
    ['black jacket under 500', { categorySlug: 'jackets', colorCode: 'black', maxPricePiasters: 50_000 }],
  ])('only turns what’s clear in "%s" into hard filters', (text, expected) => {
    expect(readStatedFilters(text)).toEqual(expected);
  });
});
