import type { Locale } from '@metaagent/i18n';

/** Words that come with the data, such as a product's name, in both languages. */
export type LocalizedText = Readonly<Record<Locale, string>>;
