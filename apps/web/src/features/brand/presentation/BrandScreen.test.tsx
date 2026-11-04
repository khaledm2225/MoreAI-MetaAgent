import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FollowRepository } from '../../../core/domain/ports';
import { fakeCatalog, failing, testProduct } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { BrandScreen } from './BrandScreen';
import { strings } from './strings';

function fakeFollows(following = false): FollowRepository {
  return { isFollowing: () => Promise.resolve(following), setFollowing: vi.fn(() => Promise.resolve()) };
}

describe('BrandScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('shows the brand with its products', async () => {
    renderInLocale(<BrandScreen merchantId="m" catalog={fakeCatalog([testProduct()])} follows={fakeFollows()} onOpenProduct={() => {}} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Brand' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Black jacket/ })).toBeInTheDocument();
  });

  it('follows and unfollows', async () => {
    const follows = fakeFollows();
    renderInLocale(<BrandScreen merchantId="m" catalog={fakeCatalog([])} follows={follows} onOpenProduct={() => {}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Follow' }));
    expect(follows.setFollowing).toHaveBeenCalledWith('m', true);
    expect(screen.getByRole('button', { name: 'Following' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Following' }));
    expect(follows.setFollowing).toHaveBeenCalledWith('m', false);
  });

  it('shows Following for a brand already followed', async () => {
    renderInLocale(<BrandScreen merchantId="m" catalog={fakeCatalog([])} follows={fakeFollows(true)} onOpenProduct={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Following' })).toBeInTheDocument();
  });

  it('says when it has no products', async () => {
    renderInLocale(<BrandScreen merchantId="m" catalog={fakeCatalog([])} follows={fakeFollows()} onOpenProduct={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'No products yet' })).toBeInTheDocument();
  });

  it('handles a missing brand and an error', async () => {
    const first = renderInLocale(<BrandScreen merchantId="none" catalog={fakeCatalog([])} follows={fakeFollows()} onOpenProduct={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'This brand isn’t here' })).toBeInTheDocument();
    first.unmount();
    renderInLocale(<BrandScreen merchantId="m" catalog={{ ...fakeCatalog([]), getMerchant: failing }} follows={fakeFollows()} onOpenProduct={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
