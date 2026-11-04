import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInLocale } from '../../../test/render';
import { StartScreen } from './StartScreen';
import { strings } from './strings';

function setup(locale: 'en' | 'ar' = 'en') {
  const onJoinAsClient = vi.fn();
  const onJoinAsMerchant = vi.fn();
  const view = renderInLocale(
    <StartScreen onJoinAsClient={onJoinAsClient} onJoinAsMerchant={onJoinAsMerchant} />,
    locale,
  );
  return { onJoinAsClient, onJoinAsMerchant, ...view };
}

describe('StartScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('opens with the brand line as its one heading', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Gets your taste' })).toBeInTheDocument();
  });

  it('offers the 2 ways in', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Join as client' })).toHaveAttribute('data-prominence', 'primary');
    expect(screen.getByRole('button', { name: 'Join as merchant' })).toHaveAttribute('data-prominence', 'secondary');
  });

  it('takes a client down the client path', async () => {
    const { onJoinAsClient, onJoinAsMerchant } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Join as client' }));
    expect(onJoinAsClient).toHaveBeenCalledTimes(1);
    expect(onJoinAsMerchant).not.toHaveBeenCalled();
  });

  it('takes a merchant down the merchant path', async () => {
    const { onJoinAsClient, onJoinAsMerchant } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Join as merchant' }));
    expect(onJoinAsMerchant).toHaveBeenCalledTimes(1);
    expect(onJoinAsClient).not.toHaveBeenCalled();
  });

  it('asks for no login', () => {
    setup();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('sits on the red ground, a big moment', () => {
    setup();
    expect(screen.getByRole('main')).toHaveAttribute('data-ground', 'brand');
  });

  it('says clearly the brands are made up', () => {
    setup();
    expect(screen.getByText('Demo: brands and products are made up')).toBeInTheDocument();
  });

  it('speaks Arabic', () => {
    setup('ar');
    expect(screen.getByRole('heading', { level: 1, name: 'فاهم ذوقك' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ادخل كعميل' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ادخل كتاجر' })).toBeInTheDocument();
  });

  it('lets a person switch language from the first screen', async () => {
    const { root } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'العربية' }));
    expect(root.dir).toBe('rtl');
    expect(screen.getByRole('heading', { level: 1, name: 'فاهم ذوقك' })).toBeInTheDocument();
  });
});
