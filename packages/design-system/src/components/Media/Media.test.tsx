import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Media } from './Media';

describe('Media', () => {
  it('shows the image with its description, loading lazily', () => {
    render(<Media src="/jacket.jpg" alt="A black jacket" />);
    const image = screen.getByRole('img', { name: 'A black jacket' });
    expect(image).toHaveAttribute('src', '/jacket.jpg');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('keeps its shape while loading, so the page never jumps', () => {
    render(<Media src="/jacket.jpg" alt="A black jacket" ratio="square" data-testid="media" />);
    expect(screen.getByTestId('media')).toHaveAttribute('data-ratio', 'square');
  });

  it('defaults to the portrait shape of a clothing photo', () => {
    render(<Media src="/jacket.jpg" alt="A black jacket" data-testid="media" />);
    expect(screen.getByTestId('media')).toHaveAttribute('data-ratio', 'portrait');
  });

  it('can load right away for the first thing on a screen', () => {
    render(<Media src="/jacket.jpg" alt="A black jacket" priority />);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'eager');
  });

  it('keeps the description and shows a calm fallback when the image fails', () => {
    render(<Media src="/missing.jpg" alt="A black jacket" data-testid="media" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img', { name: 'A black jacket' })).not.toHaveAttribute('src');
    expect(screen.getByTestId('media').querySelector('[data-icon="image"]')).toBeInTheDocument();
  });

  it('tries again when it gets a new image', () => {
    const { rerender } = render(<Media src="/missing.jpg" alt="A black jacket" />);
    fireEvent.error(screen.getByRole('img'));
    rerender(<Media src="/jacket.jpg" alt="A black jacket" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/jacket.jpg');
  });
});
