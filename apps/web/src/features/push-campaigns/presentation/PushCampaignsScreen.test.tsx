import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Campaign, CampaignAudience } from '../../../core/domain/merchant';
import type { CampaignsRepository } from '../../../core/domain/ports';
import { failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { PushCampaignsScreen } from './PushCampaignsScreen';
import { strings } from './strings';

function fake(audience: CampaignAudience = { followers: 120, buyers: 48, withConsent: 86 }) {
  let items: readonly Campaign[] = [];
  const repository: CampaignsRepository = {
    list: () => Promise.resolve(items),
    audience: () => Promise.resolve(audience),
    send: vi.fn((title: string, body: string) => {
      const campaign: Campaign = { id: 'c', title, body, status: 'sent', audienceSize: audience.withConsent, opens: 43, orders: 3, sentAt: new Date('2026-11-04T20:00:00+02:00') };
      items = [campaign];
      return Promise.resolve(campaign);
    }),
  };
  return repository;
}

describe('PushCampaignsScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('starts empty, and is clear about who gets a message', async () => {
    renderInLocale(<PushCampaignsScreen campaigns={fake()} />);
    expect(await screen.findByRole('heading', { name: 'No campaigns yet' })).toBeInTheDocument();
    expect(screen.getByText(/86 of your 120 followers and 48 buyers agreed to marketing/)).toBeInTheDocument();
    expect(screen.getByText('Your brand’s name appears on every message.')).toBeInTheDocument();
  });

  it('won’t let a brand message people who didn’t agree', async () => {
    renderInLocale(<PushCampaignsScreen campaigns={fake({ followers: 10, buyers: 5, withConsent: 0 })} />);
    expect(await screen.findByText(/Nobody agreed to marketing/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Write a campaign' })).not.toBeInTheDocument();
  });

  it('needs a title and a message', async () => {
    const campaigns = fake();
    renderInLocale(<PushCampaignsScreen campaigns={campaigns} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Write a campaign' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send campaign' }));
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute('aria-invalid', 'true');
    expect(campaigns.send).not.toHaveBeenCalled();
  });

  it('sends, then shows the results', async () => {
    const campaigns = fake();
    renderInLocale(<PushCampaignsScreen campaigns={campaigns} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Write a campaign' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'New drop');
    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Winter jackets are here');
    await userEvent.click(screen.getByRole('button', { name: 'Send campaign' }));
    expect(campaigns.send).toHaveBeenCalledWith('New drop', 'Winter jackets are here');
    expect(await screen.findByText('Opens: 43')).toBeInTheDocument();
    expect(screen.getByText('Orders: 3')).toBeInTheDocument();
  });

  it('shows failures', async () => {
    const first = renderInLocale(<PushCampaignsScreen campaigns={{ ...fake(), list: failing }} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
    first.unmount();
    renderInLocale(<PushCampaignsScreen campaigns={{ ...fake(), send: failing }} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Write a campaign' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'New drop');
    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Here');
    await userEvent.click(screen.getByRole('button', { name: 'Send campaign' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
