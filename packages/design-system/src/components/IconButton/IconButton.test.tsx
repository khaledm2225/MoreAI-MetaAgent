import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('is named for screen readers, since it shows no words', () => {
    render(<IconButton icon="close" label="Close" />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button.querySelector('[data-icon="close"]')).toBeInTheDocument();
  });

  it('answers a press', async () => {
    const onClick = vi.fn();
    render(<IconButton icon="close" label="Close" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('never submits a form by accident, but can when asked', () => {
    const { rerender } = render(<IconButton icon="send" label="Send" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    rerender(<IconButton icon="send" label="Send" type="submit" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it.each(['primary', 'secondary', 'quiet'] as const)('takes the %s prominence', (prominence) => {
    render(<IconButton icon="close" label="Close" prominence={prominence} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-prominence', prominence);
  });
});
