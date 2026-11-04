import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Banner } from './Banner';
import { Skeleton } from './Skeleton';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('tells screen readers what is happening', () => {
    render(<Spinner label="Loading products" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading products');
  });
});

describe('Skeleton', () => {
  it('stays out of the way of screen readers', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(['text', 'block', 'circle'] as const)('takes the %s shape', (shape) => {
    const { container } = render(<Skeleton shape={shape} />);
    expect(container.firstChild).toHaveAttribute('data-shape', shape);
  });
});

describe('Banner', () => {
  it('announces news politely', () => {
    render(<Banner>Saved</Banner>);
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Saved');
    expect(banner).toHaveAttribute('data-tone', 'info');
    expect(banner.querySelector('[data-icon="info"]')).toBeInTheDocument();
  });

  it('shows success with an icon, never by color alone', () => {
    render(<Banner tone="success">Done</Banner>);
    expect(screen.getByRole('status').querySelector('[data-icon="check"]')).toBeInTheDocument();
  });

  it('interrupts for an error', () => {
    render(<Banner tone="error">Failed</Banner>);
    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('Failed');
    expect(banner.querySelector('[data-icon="alert"]')).toBeInTheDocument();
  });

  it('sits on a cream surface, so its words stay readable on red', () => {
    render(<Banner>Saved</Banner>);
    expect(screen.getByRole('status')).toHaveAttribute('data-ground', 'plain');
  });
});
