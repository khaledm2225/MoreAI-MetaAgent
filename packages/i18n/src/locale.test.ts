import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, directionOf, isLocale, tagOf } from './locale';

describe('directionOf', () => {
  it('reads Arabic right to left and English left to right', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
  });
});

describe('isLocale', () => {
  it.each(['ar', 'en'])('accepts %s', (value) => {
    expect(isLocale(value)).toBe(true);
  });

  it.each(['fr', 'AR', '', null, undefined, 3])('refuses %s', (value) => {
    expect(isLocale(value)).toBe(false);
  });
});

describe('tagOf', () => {
  it('keeps Latin digits in Arabic, so prices read the same in both languages', () => {
    expect(tagOf('ar')).toBe('ar-EG-u-nu-latn');
    expect(tagOf('en')).toBe('en-EG');
  });
});

describe('DEFAULT_LOCALE', () => {
  it('is English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });
});
