import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Catalogs } from './catalogs';
import { createFormatters, type Formatters } from './format';
import { DEFAULT_LOCALE, directionOf, type Direction, type Locale } from './locale';
import type { LocaleStore } from './locale-store';
import { createTranslator, type Translator } from './translator';

export interface LocaleValue {
  readonly locale: Locale;
  readonly direction: Direction;
  readonly format: Formatters;
  readonly setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export interface I18nProviderProps {
  readonly store: LocaleStore;
  /** The element that carries the page's `lang` and `dir`: the `html` element. */
  readonly root: HTMLElement;
  readonly children: ReactNode;
}

export function I18nProvider({ store, root, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => store.read() ?? DEFAULT_LOCALE);
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

  const value = useMemo<LocaleValue>(
    () => ({ locale, direction, format: createFormatters(locale), setLocale }),
    [locale, direction, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (value === null) {
    throw new Error('useLocale must be used inside I18nProvider.');
  }
  return value;
}

/** A translator for one screen's own words, in the current language. */
export function useTranslations<Key extends string>(catalogs: Catalogs<Key>): Translator<Key> {
  const { locale } = useLocale();
  return useMemo(() => createTranslator(locale, catalogs[locale]), [locale, catalogs]);
}
