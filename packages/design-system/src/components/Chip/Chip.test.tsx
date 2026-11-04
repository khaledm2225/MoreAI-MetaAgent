import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';

describe('Chip', () => {
  it('says whether it is selected', () => {
    const { rerender } = render(<Chip selected={false}>L</Chip>);
    expect(screen.getByRole('button', { name: 'L' })).toHaveAttribute('aria-pressed', 'false');
    rerender(<Chip selected>L</Chip>);
    expect(screen.getByRole('button', { name: 'L' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('answers a press', async () => {
    const onClick = vi.fn();
    render(
      <Chip selected={false} onClick={onClick}>
        L
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores presses when unavailable, such as a size that sold out', async () => {
    const onClick = vi.fn();
    render(
      <Chip selected={false} disabled onClick={onClick}>
        L
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('never submits a form by accident', () => {
    render(<Chip selected={false}>L</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
