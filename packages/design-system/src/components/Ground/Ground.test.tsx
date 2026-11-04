import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Ground } from './Ground';

describe('Ground', () => {
  it('defaults to the cream page, the app\'s background', () => {
    render(<Ground data-testid="ground">words</Ground>);
    expect(screen.getByTestId('ground')).toHaveAttribute('data-ground', 'plain');
  });

  it('tells what is inside that it sits on the red ground, for big moments', () => {
    render(
      <Ground kind="brand" data-testid="ground">
        words
      </Ground>,
    );
    expect(screen.getByTestId('ground')).toHaveAttribute('data-ground', 'brand');
  });

  it('can fill the screen', () => {
    render(
      <Ground fillViewport data-testid="ground">
        words
      </Ground>,
    );
    expect(screen.getByTestId('ground')).toHaveAttribute('data-fill-viewport', 'true');
  });

  it('does not fill the screen unless asked', () => {
    render(<Ground data-testid="ground">words</Ground>);
    expect(screen.getByTestId('ground')).not.toHaveAttribute('data-fill-viewport');
  });

  it('renders the requested landmark', () => {
    render(
      <Ground as="main" kind="brand">
        words
      </Ground>,
    );
    expect(screen.getByRole('main')).toHaveTextContent('words');
  });
});
