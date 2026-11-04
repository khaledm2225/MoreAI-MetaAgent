export const locales = ['ar', 'en'] as const;

export type Locale = (typeof locales)[number];
export type Direction = 'rtl' | 'ltr';

/** What a person sees until they choose another language. */
export const DEFAULT_LOCALE: Locale = 'en';

const details: Readonly<Record<Locale, { readonly direction: Direction; readonly tag: string }>> = {
  // Latin digits, so a price reads the same in both languages.
  ar: { direction: 'rtl', tag: 'ar-EG-u-nu-latn' },
  en: { direction: 'ltr', tag: 'en-EG' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function directionOf(locale: Locale): Direction {
  return details[locale].direction;
}

/** The full language tag for the browser's `Intl` formatters. */
export function tagOf(locale: Locale): string {
  return details[locale].tag;
}
