import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderInLocale } from '../test/render';
import { App } from './App';
import { createAppContainer } from './container';

function renderAt(path: string) {
  return renderInLocale(
    <MemoryRouter initialEntries={[path]}>
      <App container={createAppContainer()} />
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('opens on the first screen', () => {
    renderAt('/');
    expect(screen.getByRole('button', { name: 'Join as client' })).toBeInTheDocument();
  });

  it('sends an unknown address back to the first screen', () => {
    renderAt('/nothing-here');
    expect(screen.getByRole('button', { name: 'Join as merchant' })).toBeInTheDocument();
  });
});
