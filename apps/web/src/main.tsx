import '@metaagent/design-system/styles.css';
import { createWebLocaleStore, I18nProvider } from '@metaagent/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import { createAppContainer, createRemoteAppContainer, type AppContainer } from './app/container';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function visitorId(storage: Storage | null): string {
  const key = 'moreai.visitor';
  const known = storage?.getItem(key);
  if (known !== null && known !== undefined) {
    return known;
  }
  const created = crypto.randomUUID();
  storage?.setItem(key, created);
  return created;
}

const element = document.getElementById('root');
if (element === null) {
  throw new Error('The page has no root element.');
}
const root = createRoot(element);
const storage = browserStorage();

function start(container: AppContainer) {
  root.render(
    <StrictMode>
      <I18nProvider store={createWebLocaleStore(storage)} root={document.documentElement}>
        <BrowserRouter>
          <App container={container} />
        </BrowserRouter>
      </I18nProvider>
    </StrictMode>,
  );
}

if (import.meta.env.VITE_BACKEND === 'remote') {
  void createRemoteAppContainer({
    clock: () => new Date(),
    visitorId: visitorId(storage),
    origin: window.location.origin,
    locale: () => document.documentElement.lang,
  }).then(start);
} else {
  start(createAppContainer());
}
