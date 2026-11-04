import { describe, expect, it } from 'vitest';
import { readShopperRequest } from './requestReader';

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
});
