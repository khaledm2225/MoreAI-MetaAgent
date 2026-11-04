import { describe, expect, it } from 'vitest';
import {
  canMoveOrder,
  canRateOrder,
  checkOrderLimits,
  FREE_ORDERS_PER_BRAND,
  freeOrdersLeft,
  addressProblems,
  isFinishedOrder,
  isValidEgyptianMobile,
  ORDER_LIMITS,
  type Address,
} from './order';

describe('order moves', () => {
  it.each([
    ['PLACED', 'ACCEPTED'],
    ['PLACED', 'REJECTED'],
    ['PLACED', 'CANCELLED'],
    ['ACCEPTED', 'OUT_FOR_DELIVERY'],
    ['ACCEPTED', 'CANCELLED'],
    ['OUT_FOR_DELIVERY', 'DELIVERED'],
    ['OUT_FOR_DELIVERY', 'NOT_DELIVERED'],
  ] as const)('allows %s to %s', (from, to) => {
    expect(canMoveOrder(from, to)).toBe(true);
  });

  it.each([
    ['PLACED', 'DELIVERED'],
    ['DELIVERED', 'PLACED'],
    ['REJECTED', 'ACCEPTED'],
    ['OUT_FOR_DELIVERY', 'CANCELLED'],
  ] as const)('refuses %s to %s', (from, to) => {
    expect(canMoveOrder(from, to)).toBe(false);
  });

  it.each(['DELIVERED', 'REJECTED', 'CANCELLED', 'NOT_DELIVERED'] as const)('%s is finished', (status) => {
    expect(isFinishedOrder(status)).toBe(true);
  });

  it.each(['PLACED', 'ACCEPTED', 'OUT_FOR_DELIVERY'] as const)('%s is still active', (status) => {
    expect(isFinishedOrder(status)).toBe(false);
  });
});

describe('ratings', () => {
  it('allows a rating only on a delivered order, once', () => {
    expect(canRateOrder({ status: 'DELIVERED', rating: null })).toBe(true);
    expect(canRateOrder({ status: 'DELIVERED', rating: { stars: 5, comment: '' } })).toBe(false);
    expect(canRateOrder({ status: 'OUT_FOR_DELIVERY', rating: null })).toBe(false);
  });
});

describe('checkOrderLimits', () => {
  it('uses the agreed limits', () => {
    expect(ORDER_LIMITS).toEqual({ perShopperPerDay: 3, perBrandPerDay: 1 });
  });

  it('allows an order within the limits', () => {
    expect(checkOrderLimits({ placedToday: [], merchantIds: ['a', 'b'] })).toEqual({ allowed: true });
  });

  it('stops the fourth order of a day', () => {
    expect(checkOrderLimits({ placedToday: ['a', 'b', 'c'], merchantIds: ['d'] })).toEqual({
      allowed: false,
      reason: 'SHOPPER_DAILY_LIMIT',
    });
  });

  it('stops a cart that would pass the limit, since each brand is one order', () => {
    expect(checkOrderLimits({ placedToday: ['a', 'b'], merchantIds: ['c', 'd'] })).toEqual({
      allowed: false,
      reason: 'SHOPPER_DAILY_LIMIT',
    });
  });

  it('stops a second order from the same brand in a day, and names the brand', () => {
    expect(checkOrderLimits({ placedToday: ['a'], merchantIds: ['a'] })).toEqual({
      allowed: false,
      reason: 'BRAND_DAILY_LIMIT',
      merchantId: 'a',
    });
  });
});

describe('freeOrdersLeft', () => {
  it('counts down from the first 100 orders, per brand', () => {
    expect(FREE_ORDERS_PER_BRAND).toBe(100);
    expect(freeOrdersLeft(0)).toBe(100);
    expect(freeOrdersLeft(37)).toBe(63);
  });

  it('never goes below zero', () => {
    expect(freeOrdersLeft(150)).toBe(0);
  });
});

describe('isValidEgyptianMobile', () => {
  it.each(['01012345678', '01112345678', '01212345678', '01512345678'])('accepts %s', (mobile) => {
    expect(isValidEgyptianMobile(mobile)).toBe(true);
  });

  it.each(['01312345678', '0101234567', '010123456789', '1012345678', '0101234567a', ''])('refuses %s', (mobile) => {
    expect(isValidEgyptianMobile(mobile)).toBe(false);
  });
});

describe('addressProblems', () => {
  const address: Address = {
    recipientName: 'Khaled',
    mobile: '01012345678',
    area: 'Maadi',
    street: 'Road 9',
    building: '12',
    floor: '',
    apartment: '',
    landmark: '',
    notes: '',
  };

  it('finds nothing wrong in a complete address', () => {
    expect(addressProblems(address)).toEqual([]);
  });

  it('names what is missing, and leaves the optional parts alone', () => {
    expect(addressProblems({ ...address, recipientName: ' ', street: '', building: '' })).toEqual([
      'recipientName',
      'street',
      'building',
    ]);
  });

  it('refuses a mobile that is not Egyptian', () => {
    expect(addressProblems({ ...address, mobile: '12345' })).toEqual(['mobile']);
  });
});
