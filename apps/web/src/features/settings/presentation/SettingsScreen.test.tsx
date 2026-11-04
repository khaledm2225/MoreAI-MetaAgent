import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { SettingsScreen, type SettingsScreenProps } from './SettingsScreen';
import { strings } from './strings';

function setup(overrides: Partial<SettingsScreenProps> = {}) {
  let show = true;
  const settings: SettingsScreenProps['settings'] = {
    current: () => Promise.resolve({ showMoreAiButton: show }),
    setShowMoreAiButton: vi.fn((next: boolean) => {
      show = next;
      return Promise.resolve({ showMoreAiButton: show });
    }),
  };
  const notifications: SettingsScreenProps['notifications'] = {
    preferences: () => Promise.resolve({ marketingConsent: false, mutedMerchantIds: [] }),
    setMarketingConsent: vi.fn(() => Promise.resolve({ marketingConsent: true, mutedMerchantIds: [] })),
  };
  const session: SettingsScreenProps['session'] = { deleteAccount: vi.fn(() => Promise.resolve({ role: null, clientGatePassed: false, merchantId: null, accountDeleted: true })) };
  const onDeleted = vi.fn();
  const view = renderInLocale(<SettingsScreen settings={settings} notifications={notifications} session={session} onDeleted={onDeleted} {...overrides} />);
  return { settings, notifications, session, onDeleted, ...view };
}

describe('SettingsScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('hides the MoreAI button on request', async () => {
    const { settings } = setup();
    const toggle = await screen.findByRole('switch', { name: 'Show MoreAI button' });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(settings.setShowMoreAiButton).toHaveBeenCalledWith(false);
  });

  it('changes the marketing choice', async () => {
    const { notifications } = setup();
    await userEvent.click(await screen.findByRole('switch', { name: 'Allow marketing messages' }));
    expect(notifications.setMarketingConsent).toHaveBeenCalledWith(true);
  });

  it('switches language', async () => {
    const { root } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'العربية' }));
    expect(root.dir).toBe('rtl');
  });

  it('asks before deleting the account', async () => {
    const { session, onDeleted } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByRole('dialog', { name: 'Delete your account?' })).toBeInTheDocument();
    expect(session.deleteAccount).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Keep my account' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('deletes after confirmation', async () => {
    const { session, onDeleted } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete my account' }));
    const buttons = await screen.findAllByRole('button', { name: 'Delete my account' });
    const confirm = buttons.at(-1);
    if (confirm === undefined) {
      throw new Error('Expected a confirm button.');
    }
    await userEvent.click(confirm);
    expect(session.deleteAccount).toHaveBeenCalledTimes(1);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('shows an error with a way to try again', async () => {
    setup({ settings: { current: failing, setShowMoreAiButton: failing } });
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
