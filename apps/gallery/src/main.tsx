import '@metaagent/design-system/styles.css';
import { createWebLocaleStore } from '@metaagent/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Gallery } from './Gallery';
import { I18nProvider } from './i18n';
import { ar } from './strings/ar';
import { en } from './strings/en';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const container = document.getElementById('root');
if (container === null) {
  throw new Error('The page has no root element.');
}

createRoot(container).render(
  <StrictMode>
    <I18nProvider
      catalogs={{ ar, en }}
      store={createWebLocaleStore(browserStorage())}
      languages={navigator.languages}
      root={document.documentElement}
    >
      <Gallery />
    </I18nProvider>
  </StrictMode>,
);
