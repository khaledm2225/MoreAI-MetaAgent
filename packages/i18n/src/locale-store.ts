import { isLocale, type Locale } from './locale';

const STORAGE_KEY = 'metaagent.locale';

/** Where a person's language choice is kept. */
export interface LocaleStore {
  read(): Locale | null;
  write(locale: Locale): void;
}

export function createMemoryLocaleStore(): LocaleStore {
  let saved: Locale | null = null;
  return {
    read: () => saved,
    write: (locale) => {
      saved = locale;
    },
  };
}

/** A blocked or missing browser storage only means the choice isn't remembered next time. */
export function createWebLocaleStore(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
): LocaleStore {
  return {
    read: () => {
      try {
        const saved = storage?.getItem(STORAGE_KEY);
        return isLocale(saved) ? saved : null;
      } catch {
        return null;
      }
    },
    write: (locale) => {
      try {
        storage?.setItem(STORAGE_KEY, locale);
      } catch {
        // The choice still applies until the page closes.
      }
    },
  };
}
