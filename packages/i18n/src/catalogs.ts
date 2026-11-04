import type { Locale } from './locale';
import type { Catalog, CatalogEntry } from './translator';

export type Catalogs<Key extends string> = Readonly<Record<Locale, Catalog<Key>>>;

/** One screen's words in both languages. A key missing from either one doesn't compile. */
export function defineCatalogs<const English extends Catalog>(
  en: English,
  ar: Readonly<Record<keyof English & string, CatalogEntry>>,
): Catalogs<keyof English & string> {
  return { en: en as Catalog<keyof English & string>, ar };
}

function allForms(entry: CatalogEntry): readonly string[] {
  return typeof entry === 'string' ? [entry] : Object.values(entry);
}

function valuesIn(entry: CatalogEntry): string {
  const names = new Set<string>();
  for (const form of allForms(entry)) {
    for (const match of form.matchAll(/\{(\w+)\}/g)) {
      if (match[1] !== undefined) {
        names.add(match[1]);
      }
    }
  }
  return [...names].sort().join(',') || '(none)';
}

export interface CatalogCheckOptions {
  /** Keys that read the same in both languages on purpose, such as size labels. */
  readonly sameInBoth?: readonly string[];
}

/** What's wrong with a screen's words, for its test to report. */
export function catalogProblems<Key extends string>(
  catalogs: Catalogs<Key>,
  { sameInBoth = [] }: CatalogCheckOptions = {},
): readonly string[] {
  const problems: string[] = [];
  for (const key of Object.keys(catalogs.en) as Key[]) {
    const english = catalogs.en[key];
    const arabic = catalogs.ar[key];
    for (const [locale, entry] of [['en', english], ['ar', arabic]] as const) {
      if (allForms(entry).some((form) => form.trim() === '')) {
        problems.push(`${locale}: "${key}" is empty`);
      }
    }
    const hasWords = allForms(arabic).every((form) => form.trim() !== '');
    if (hasWords && JSON.stringify(english) === JSON.stringify(arabic) && !sameInBoth.includes(key)) {
      problems.push(`"${key}" is the same in both languages`);
    }
    const englishValues = valuesIn(english);
    const arabicValues = valuesIn(arabic);
    if (englishValues !== arabicValues) {
      problems.push(`"${key}" uses different values: ${englishValues} | ${arabicValues}`);
    }
  }
  return problems;
}
