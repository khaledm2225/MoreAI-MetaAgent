import { createMemoryLocaleStore, I18nProvider, type Locale } from '@metaagent/i18n';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

/** Renders a screen the way the app does, in the language a test asks for. */
export function renderInLocale(ui: ReactNode, locale: Locale = 'en') {
  const store = createMemoryLocaleStore();
  store.write(locale);
  const root = document.createElement('html');
  return {
    root,
    ...render(
      <I18nProvider store={store} root={root}>
        {ui}
      </I18nProvider>,
    ),
  };
}
