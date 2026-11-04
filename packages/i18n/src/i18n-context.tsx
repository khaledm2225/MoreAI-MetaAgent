import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createFormatters, type Formatters } from './format';
import { directionOf, matchLocale, type Direction, type Locale } from './locale';
import type { LocaleStore } from './locale-store';
import { createTranslator, type Catalog, type Translator } from './translator';

export interface I18nValue<Key extends string> {
  readonly locale: Locale;
  readonly direction: Direction;
  readonly t: Translator<Key>;
  readonly format: Formatters;
  readonly setLocale: (locale: Locale) => void;
}

export interface I18nProviderProps<Key extends string> {
  readonly catalogs: Readonly<Record<Locale, Catalog<Key>>>;
  readonly store: LocaleStore;
  /** The browser's languages, in the person's order. */
  readonly languages: readonly string[];
  /** The element that carries the page's `lang` and `dir`: the `html` element. */
  readonly root: HTMLElement;
  readonly children: ReactNode;
}

/** Makes the language layer for one app, typed to that app's own message keys. */
export function createI18nContext<Key extends string>() {
  const Context = createContext<I18nValue<Key> | null>(null);

  function I18nProvider({ catalogs, store, languages, root, children }: I18nProviderProps<Key>) {
    const [locale, setLocaleState] = useState<Locale>(() => store.read() ?? matchLocale(languages));
    const direction = directionOf(locale);

    // Before the browser paints, so a page never flashes in the wrong direction.
    useLayoutEffect(() => {
      root.lang = locale;
      root.dir = direction;
    }, [root, locale, direction]);

    const setLocale = useCallback(
      (next: Locale) => {
        store.write(next);
        setLocaleState(next);
      },
      [store],
    );

    const value = useMemo<I18nValue<Key>>(
      () => ({
        locale,
        direction,
        t: createTranslator(locale, catalogs[locale]),
        format: createFormatters(locale),
        setLocale,
      }),
      [locale, direction, catalogs, setLocale],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useI18n(): I18nValue<Key> {
    const value = useContext(Context);
    if (value === null) {
      throw new Error('useI18n must be used inside I18nProvider.');
    }
    return value;
  }

  return { I18nProvider, useI18n };
}
