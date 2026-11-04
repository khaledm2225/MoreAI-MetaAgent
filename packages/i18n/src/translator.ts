import { tagOf, type Locale } from './locale';

/** A message that changes with a number. Arabic uses all six forms, English only two. */
export type PluralEntry = Readonly<Partial<Record<Intl.LDMLPluralRule, string>>> & {
  readonly other: string;
};

export type CatalogEntry = string | PluralEntry;
export type Catalog<Key extends string = string> = Readonly<Record<Key, CatalogEntry>>;
export type MessageValues = Readonly<Record<string, string | number>>;
export type Translator<Key extends string = string> = (key: Key, values?: MessageValues) => string;

export function createTranslator<Key extends string>(
  locale: Locale,
  catalog: Catalog<Key>,
): Translator<Key> {
  const tag = tagOf(locale);
  const plurals = new Intl.PluralRules(tag);
  const numbers = new Intl.NumberFormat(tag);

  return (key, values = {}) => {
    const entry: CatalogEntry = catalog[key];
    const message = typeof entry === 'string' ? entry : pickPlural(key, entry, values, plurals);
    return message.replace(/\{(\w+)\}/g, (_match, name: string) => {
      const value = values[name];
      if (value === undefined) {
        throw new Error(`The message "${key}" needs a value for "${name}".`);
      }
      return typeof value === 'number' ? numbers.format(value) : value;
    });
  };
}

function pickPlural(
  key: string,
  entry: PluralEntry,
  values: MessageValues,
  plurals: Intl.PluralRules,
): string {
  const count = values['count'];
  if (typeof count !== 'number') {
    throw new Error(`The message "${key}" needs a number for "count".`);
  }
  return entry[plurals.select(count)] ?? entry.other;
}
