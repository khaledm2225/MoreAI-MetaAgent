import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('stays closed until asked', () => {
    render(
      <Dialog open={false} title="Confirm" onClose={() => {}}>
        words
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens, named by its title', () => {
    render(
      <Dialog open title="Confirm" onClose={() => {}}>
        words
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Confirm' })).toHaveTextContent('words');
  });

  it('closes when the parent says so', () => {
    const { rerender } = render(
      <Dialog open title="Confirm" onClose={() => {}}>
        words
      </Dialog>,
    );
    rerender(
      <Dialog open={false} title="Confirm" onClose={() => {}}>
        words
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('tells the parent when the Escape key closes it', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Confirm" onClose={onClose}>
        words
      </Dialog>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns focus to what opened it, so keyboard users keep their place', () => {
    const screenWithDialog = (open: boolean) => (
      <>
        <button type="button">Open</button>
        <Dialog open={open} title="Confirm" onClose={() => {}}>
          words
        </Dialog>
      </>
    );
    const { rerender } = render(screenWithDialog(false));
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    rerender(screenWithDialog(true));
    expect(opener).not.toHaveFocus();
    rerender(screenWithDialog(false));
    expect(opener).toHaveFocus();
  });

  it('shows the actions it is given', () => {
    render(
      <Dialog open title="Confirm" onClose={() => {}} actions={<button type="button">Yes</button>}>
        words
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
  });

  it('is a cream surface, so its reading text passes on any ground', () => {
    render(
      <Dialog open title="Confirm" onClose={() => {}}>
        words
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-ground', 'plain');
  });
});
