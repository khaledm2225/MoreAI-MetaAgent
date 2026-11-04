import { describe, expect, it } from 'vitest';
import { createTranslator } from './translator';

const english = {
  greeting: 'Hello',
  welcome: 'Hello {name}, welcome back {name}',
  pieces: { one: '{count} piece', other: '{count} pieces' },
} as const;

const arabic = {
  greeting: 'أهلا',
  welcome: 'أهلا {name}، نورت يا {name}',
  pieces: {
    zero: 'مفيش قطع',
    one: 'قطعة واحدة',
    two: 'قطعتين',
    few: '{count} قطع',
    many: '{count} قطعة',
    other: '{count} قطعة',
  },
} as const;

describe('createTranslator', () => {
  const t = createTranslator('en', english);
  const tArabic = createTranslator('ar', arabic);

  it('reads a key', () => {
    expect(t('greeting')).toBe('Hello');
    expect(tArabic('greeting')).toBe('أهلا');
  });

  it('fills every copy of a value', () => {
    expect(t('welcome', { name: 'Khaled' })).toBe('Hello Khaled, welcome back Khaled');
  });

  it('refuses a missing value instead of showing braces to a shopper', () => {
    expect(() => t('welcome')).toThrow('name');
  });

  it.each([
    [1, '1 piece'],
    [2, '2 pieces'],
    [0, '0 pieces'],
    [1000, '1,000 pieces'],
  ])('uses the English plural for %i', (count, expected) => {
    expect(t('pieces', { count })).toBe(expected);
  });

  it.each([
    [0, 'مفيش قطع'],
    [1, 'قطعة واحدة'],
    [2, 'قطعتين'],
    [3, '3 قطع'],
    [10, '10 قطع'],
    [11, '11 قطعة'],
    [100, '100 قطعة'],
  ])('uses the Arabic plural for %i', (count, expected) => {
    expect(tArabic('pieces', { count })).toBe(expected);
  });

  it('refuses a plural key with no count', () => {
    expect(() => t('pieces')).toThrow('count');
  });

  it('falls back to the other form when a language leaves one out', () => {
    const translate = createTranslator('ar', { pieces: { other: '{count} قطعة' } } as const);
    expect(translate('pieces', { count: 2 })).toBe('2 قطعة');
  });
});
