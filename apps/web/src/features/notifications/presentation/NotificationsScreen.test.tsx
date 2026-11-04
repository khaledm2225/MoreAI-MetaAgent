import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AppNotification, NotificationPreferences } from '../../../core/domain/account';
import type { NotificationsRepository } from '../../../core/domain/ports';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { NotificationsScreen } from './NotificationsScreen';
import { strings } from './strings';

const item: AppNotification = { id: 'n', merchantId: 'm', merchantName: 'Brand', kind: 'order', title: { en: 'Order placed', ar: 'الأوردر اتطلب' }, body: { en: 'Brand received it.', ar: 'البراند استلمه.' }, createdAt: new Date('2026-11-04T20:00:00+02:00'), isRead: false };

function fake(items: readonly AppNotification[]): NotificationsRepository {
  let preferences: NotificationPreferences = { marketingConsent: false, mutedMerchantIds: [] };
  return {
    list: () => Promise.resolve(items),
    markRead: () => Promise.resolve(),
    preferences: () => Promise.resolve(preferences),
    setMarketingConsent: vi.fn((marketingConsent: boolean) => {
      preferences = { ...preferences, marketingConsent };
      return Promise.resolve(preferences);
    }),
    setMerchantMuted: vi.fn((merchantId: string, muted: boolean) => {
      preferences = { ...preferences, mutedMerchantIds: muted ? [merchantId] : [] };
      return Promise.resolve(preferences);
    }),
  };
}

describe('NotificationsScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('says when it is empty, with marketing off by default', async () => {
    renderInLocale(<NotificationsScreen notifications={fake([])} />);
    expect(await screen.findByRole('heading', { name: 'No notifications yet' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Allow marketing messages' })).not.toBeChecked();
  });

  it('asks for clear consent', async () => {
    const notifications = fake([]);
    renderInLocale(<NotificationsScreen notifications={notifications} />);
    await userEvent.click(await screen.findByRole('switch'));
    expect(notifications.setMarketingConsent).toHaveBeenCalledWith(true);
    expect(await screen.findByRole('switch')).toBeChecked();
  });

  it('mutes and unmutes a brand', async () => {
    const notifications = fake([item]);
    renderInLocale(<NotificationsScreen notifications={notifications} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Mute Brand' }));
    expect(notifications.setMerchantMuted).toHaveBeenCalledWith('m', true);
    expect(await screen.findByRole('button', { name: 'Unmute Brand' })).toBeInTheDocument();
    expect(screen.getByText('Muted')).toBeInTheDocument();
  });

  it('shows an error with a way to try again', async () => {
    renderInLocale(<NotificationsScreen notifications={{ ...fake([]), list: failing }} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows a failed save', async () => {
    renderInLocale(<NotificationsScreen notifications={{ ...fake([]), setMarketingConsent: failing }} />);
    await userEvent.click(await screen.findByRole('switch'));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('speaks Arabic', async () => {
    renderInLocale(<NotificationsScreen notifications={fake([item])} />, 'ar');
    expect(await screen.findByRole('heading', { name: 'الأوردر اتطلب' })).toBeInTheDocument();
  });
});
