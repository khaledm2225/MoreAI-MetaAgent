import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInLocale } from '../test/render';
import { AppErrorBoundary } from './AppErrorBoundary';

function Broken(): never {
  throw new Error('broken');
}

describe('AppErrorBoundary', () => {
  it('shows a way back instead of a blank page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderInLocale(
      <AppErrorBoundary>
        <Broken />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
