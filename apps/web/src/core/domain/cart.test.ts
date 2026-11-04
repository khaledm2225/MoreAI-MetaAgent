import { describe, expect, it } from 'vitest';
import { cartTotalPiasters, groupCartByMerchant, lineTotalPiasters, type CartLine } from './cart';

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    id: 'l',
    productId: 'p',
    variantId: 'v',
    merchantId: 'm',
    merchantName: 'Brand',
    productName: { en: 'Jacket', ar: 'جاكيت' },
    colorName: { en: 'Black', ar: 'أسود' },
    sizeLabel: 'L',
    imagePath: null,
    unitPricePiasters: 50_000,
    quantity: 1,
    availability: 'available',
    previousUnitPricePiasters: null,
    ...overrides,
  };
}

describe('cart math', () => {
  it('multiplies a line exactly', () => {
    expect(lineTotalPiasters(line({ unitPricePiasters: 19_999, quantity: 3 }))).toBe(59_997);
  });

  it('adds up lines that can still be bought, leaving out sold out pieces', () => {
    const lines = [
      line({ unitPricePiasters: 10_000, quantity: 2 }),
      line({ unitPricePiasters: 5_000 }),
      line({ unitPricePiasters: 99_999, availability: 'soldOut' }),
    ];
    expect(cartTotalPiasters(lines)).toBe(25_000);
  });
});

describe('groupCartByMerchant', () => {
  it('keeps one group per brand, in the order they were added', () => {
    const groups = groupCartByMerchant([
      line({ id: '1', merchantId: 'b', merchantName: 'B' }),
      line({ id: '2', merchantId: 'a', merchantName: 'A' }),
      line({ id: '3', merchantId: 'b', merchantName: 'B' }),
    ]);
    expect(groups.map(({ merchantId }) => merchantId)).toEqual(['b', 'a']);
    expect(groups[0]?.lines.map(({ id }) => id)).toEqual(['1', '3']);
  });

  it('has no groups for an empty cart', () => {
    expect(groupCartByMerchant([])).toEqual([]);
  });
});
