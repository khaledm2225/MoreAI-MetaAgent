import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('shows its words and defaults to the primary, full width look', () => {
    render(<Button>Go</Button>);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveAttribute('data-prominence', 'primary');
    expect(button).toHaveAttribute('data-size', 'regular');
  });

  it('never submits a form by accident', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('can submit a form when asked', () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('answers a click', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('answers the keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks while disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  describe('while loading', () => {
    it('ignores clicks and says it is busy', async () => {
      const onClick = vi.fn();
      render(
        <Button isLoading onClick={onClick}>
          Go
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      await userEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('keeps its name for screen readers', () => {
      render(<Button isLoading>Go</Button>);
      expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    });

    it('is not busy otherwise', () => {
      render(<Button>Go</Button>);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });
  });

  it.each(['primary', 'secondary', 'quiet', 'destructive'] as const)(
    'takes the %s prominence',
    (prominence) => {
      render(<Button prominence={prominence}>Go</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-prominence', prominence);
    },
  );

  it('hugs its words when compact', () => {
    render(<Button size="compact">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'compact');
  });

  it('shows the icon it is given', () => {
    render(<Button icon="camera">Go</Button>);
    expect(screen.getByRole('button').querySelector('[data-icon="camera"]')).toBeInTheDocument();
  });

  it('shows no icon unless asked', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button').querySelector('[data-icon]')).toBeNull();
  });

  it('always shows an icon when it removes something, so color is never the only signal', () => {
    render(<Button prominence="destructive">Remove</Button>);
    expect(screen.getByRole('button').querySelector('[data-icon="trash"]')).toBeInTheDocument();
  });

  it('keeps a chosen icon on a destructive button', () => {
    render(
      <Button prominence="destructive" icon="close">
        Remove
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button.querySelector('[data-icon="close"]')).toBeInTheDocument();
    expect(button.querySelector('[data-icon="trash"]')).toBeNull();
  });

  it('hands its element to the parent', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Go</Button>);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('keeps the class a parent adds', () => {
    render(<Button className="extra">Go</Button>);
    expect(screen.getByRole('button')).toHaveClass('extra');
  });
});
