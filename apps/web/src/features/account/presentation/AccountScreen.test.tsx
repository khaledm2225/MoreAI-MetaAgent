import { catalogProblems } from '@metaagent/i18n';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PreferencesRepository } from '../../../core/domain/ports';
import type { Preference } from '../../../core/domain/taste';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { AccountScreen } from './AccountScreen';
import { strings } from './strings';

const black: Preference = { id: 'a', kind: 'color', text: { en: 'Likes black', ar: 'بيحب الأسود' }, source: 'agent' };

function fakePreferences(initial: readonly Preference[] = []) {
  let items = initial;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const repository: PreferencesRepository = {
    list: () => Promise.resolve(items),
    add: ({ kind, text }) => {
      const added: Preference = { id: `p${String(items.length)}`, kind, text, source: 'shopper' };
      items = [...items, added];
      notify();
      return Promise.resolve(added);
    },
    remove: (id) => {
      items = items.filter((item) => item.id !== id);
      notify();
      return Promise.resolve();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    repository,
    learn: (preference: Preference) => {
      items = [...items, preference];
      notify();
    },
  };
}

function setup(preferences: PreferencesRepository, locale: 'en' | 'ar' = 'en') {
  const callbacks = { onOpenOrders: vi.fn(), onOpenNotifications: vi.fn(), onOpenSettings: vi.fn() };
  renderInLocale(<AccountScreen preferences={preferences} {...callbacks} />, locale);
  return callbacks;
}

describe('AccountScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('invites the client to chat when it has no preferences', async () => {
    setup(fakePreferences().repository);
    expect(await screen.findByRole('heading', { name: 'No preferences yet' })).toBeInTheDocument();
  });

  it('shows preferences as bullet points', async () => {
    setup(fakePreferences([black]).repository);
    const list = await screen.findByRole('list', { name: 'My preferences' });
    expect(within(list).getByText('Likes black')).toBeInTheDocument();
  });

  it('pops in a preference the agent learns, live', async () => {
    const preferences = fakePreferences([black]);
    setup(preferences.repository);
    await screen.findByRole('list', { name: 'My preferences' });
    act(() => preferences.learn({ id: 'b', kind: 'budget', text: { en: 'Budget around EGP 500', ar: 'الميزانية 500' }, source: 'agent' }));
    const added = await screen.findByText('Budget around EGP 500');
    expect(added.closest('li')).toHaveAttribute('data-new', 'true');
  });

  it('lets the client add a preference', async () => {
    setup(fakePreferences().repository);
    await userEvent.click(await screen.findByRole('button', { name: 'Add a preference' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'A new preference' }), 'Cozy pieces');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    expect(await screen.findByText('Cozy pieces')).toBeInTheDocument();
  });

  it('lets the client remove a preference', async () => {
    setup(fakePreferences([black]).repository);
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Likes black' }));
    expect(await screen.findByRole('heading', { name: 'No preferences yet' })).toBeInTheDocument();
  });

  it('shows an error with a way to try again', async () => {
    setup({ ...fakePreferences().repository, list: failing });
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('leads to orders, notifications and settings', async () => {
    const { onOpenOrders, onOpenNotifications, onOpenSettings } = setup(fakePreferences().repository);
    await userEvent.click(screen.getByRole('button', { name: 'My orders' }));
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenOrders).toHaveBeenCalledTimes(1);
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('speaks Arabic', async () => {
    setup(fakePreferences([black]).repository, 'ar');
    expect(await screen.findByText('بيحب الأسود')).toBeInTheDocument();
  });
});
