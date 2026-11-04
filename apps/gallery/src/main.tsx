import '@metaagent/design-system/styles.css';
import { createWebLocaleStore, I18nProvider } from '@metaagent/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Gallery } from './Gallery';

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
      store={createWebLocaleStore(browserStorage())}
      root={document.documentElement}
    >
      <Gallery />
    </I18nProvider>
  </StrictMode>,
);
