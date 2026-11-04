import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createI18nContext } from './i18n-context';
import { createMemoryLocaleStore } from './locale-store';

const catalogs = {
  en: { greeting: 'Hello', switch: 'Switch' },
  ar: { greeting: 'أهلا', switch: 'غيّر' },
} as const;

const { I18nProvider, useI18n } = createI18nContext<keyof typeof catalogs.en>();

function Screen() {
  const { t, locale, direction, setLocale, format } = useI18n();
  return (
    <div>
      <p>{t('greeting')}</p>
      <p data-testid="details">{`${locale} ${direction} ${format.number(1200)}`}</p>
      <button type="button" onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}>
        {t('switch')}
      </button>
    </div>
  );
}

function setup({ languages = ['en-US'], saved }: { languages?: string[]; saved?: 'ar' | 'en' } = {}) {
  const store = createMemoryLocaleStore();
  if (saved !== undefined) {
    store.write(saved);
  }
  const root = document.createElement('html');
  render(
    <I18nProvider catalogs={catalogs} store={store} languages={languages} root={root}>
      <Screen />
    </I18nProvider>,
  );
  return { store, root };
}

describe('I18nProvider', () => {
  it('follows the browser language on the first visit', () => {
    setup({ languages: ['ar-EG'] });
    expect(screen.getByText('أهلا')).toBeInTheDocument();
    expect(screen.getByTestId('details')).toHaveTextContent('ar rtl 1,200');
  });

  it('prefers what the person chose before', () => {
    setup({ languages: ['ar-EG'], saved: 'en' });
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('sets the language and direction on the page root', () => {
    const { root } = setup({ languages: ['ar'] });
    expect(root.lang).toBe('ar');
    expect(root.dir).toBe('rtl');
  });

  it('switches everything together and remembers the choice', async () => {
    const { root, store } = setup();
    expect(root.dir).toBe('ltr');
    await userEvent.click(screen.getByRole('button', { name: 'Switch' }));
    expect(screen.getByText('أهلا')).toBeInTheDocument();
    expect(root.lang).toBe('ar');
    expect(root.dir).toBe('rtl');
    expect(store.read()).toBe('ar');
  });
});

describe('useI18n', () => {
  it('explains the mistake when used outside the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <>{children}</>;
    expect(() => renderHook(() => useI18n(), { wrapper })).toThrow('I18nProvider');
  });
});
