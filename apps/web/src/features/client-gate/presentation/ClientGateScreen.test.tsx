import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SessionRepository } from '../../../core/domain/ports';
import { renderInLocale } from '../../../test/render';
import { ClientGateScreen } from './ClientGateScreen';
import { strings } from './strings';

function session(passClientGate: SessionRepository['passClientGate']): SessionRepository {
  const unused = () => Promise.reject(new Error('Not used.'));
  return { current: unused, chooseRole: unused, deleteAccount: unused, passClientGate };
}

const passed = { role: 'client', clientGatePassed: true, merchantId: null, accountDeleted: false } as const;

describe('ClientGateScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('says clearly that MoreAI is an AI', () => {
    renderInLocale(<ClientGateScreen session={session(() => Promise.resolve(passed))} onPassed={() => {}} onBack={() => {}} />);
    expect(screen.getByText(/MoreAI is an AI, not a person/)).toBeInTheDocument();
  });

  it('lets an adult continue', async () => {
    const onPassed = vi.fn();
    renderInLocale(<ClientGateScreen session={session(() => Promise.resolve(passed))} onPassed={onPassed} onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: "I'm 18 or older" }));
    expect(onPassed).toHaveBeenCalledTimes(1);
  });

  it('refuses someone under age, with a way back', async () => {
    const onPassed = vi.fn();
    const onBack = vi.fn();
    renderInLocale(<ClientGateScreen session={session(() => Promise.resolve(passed))} onPassed={onPassed} onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: "I'm under 18" }));
    expect(screen.getByRole('heading', { name: 'See you later' })).toBeInTheDocument();
    expect(onPassed).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Back to the start' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows a failure and lets the client try again', async () => {
    renderInLocale(<ClientGateScreen session={session(() => Promise.reject(new Error('no')))} onPassed={() => {}} onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: "I'm 18 or older" }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "I'm 18 or older" })).toBeEnabled();
  });

  it('speaks Arabic', () => {
    renderInLocale(<ClientGateScreen session={session(() => Promise.resolve(passed))} onPassed={() => {}} onBack={() => {}} />, 'ar');
    expect(screen.getByRole('heading', { level: 1, name: 'قبل ما نبدأ' })).toBeInTheDocument();
  });
});
