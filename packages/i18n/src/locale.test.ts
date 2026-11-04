import { describe, expect, it } from 'vitest';
import { directionOf, isLocale, matchLocale, tagOf } from './locale';

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

describe('matchLocale', () => {
  it.each([
    [['ar-EG', 'en'], 'ar'],
    [['ar'], 'ar'],
    [['AR-eg'], 'ar'],
    [['en-US', 'ar'], 'en'],
    [['fr-FR', 'ar-EG', 'en'], 'ar'],
    [['fr-FR', 'en-GB'], 'en'],
  ] as const)('reads %j as %s', (languages, expected) => {
    expect(matchLocale(languages)).toBe(expected);
  });

  it.each([[[]], [['fr-FR', 'de']]] as const)('falls back to English for %j', (languages) => {
    expect(matchLocale(languages)).toBe('en');
  });

  it('does not mistake a language that starts with the same letters', () => {
    expect(matchLocale(['arn', 'fr'])).toBe('en');
  });
});
