import '@metaagent/design-system/styles.css';
import { createWebLocaleStore, I18nProvider } from '@metaagent/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import { createAppContainer } from './app/container';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const element = document.getElementById('root');
if (element === null) {
  throw new Error('The page has no root element.');
}

createRoot(element).render(
  <StrictMode>
    <I18nProvider store={createWebLocaleStore(browserStorage())} root={document.documentElement}>
      <BrowserRouter>
        <App container={createAppContainer()} />
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
);
