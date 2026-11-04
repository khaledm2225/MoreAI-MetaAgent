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

function setup({ saved }: { saved?: 'ar' | 'en' } = {}) {
  const store = createMemoryLocaleStore();
  if (saved !== undefined) {
    store.write(saved);
  }
  const root = document.createElement('html');
  render(
    <I18nProvider catalogs={catalogs} store={store} root={root}>
      <Screen />
    </I18nProvider>,
  );
  return { store, root };
}

describe('I18nProvider', () => {
  it('starts in English on the first visit', () => {
    const { root } = setup();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByTestId('details')).toHaveTextContent('en ltr 1,200');
    expect(root.lang).toBe('en');
    expect(root.dir).toBe('ltr');
  });

  it('starts in Arabic for someone who chose it before', () => {
    const { root } = setup({ saved: 'ar' });
    expect(screen.getByText('أهلا')).toBeInTheDocument();
    expect(screen.getByTestId('details')).toHaveTextContent('ar rtl 1,200');
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
