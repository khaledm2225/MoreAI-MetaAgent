import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('is always a cream surface, so reading text stays readable on the red ground', () => {
    render(<Card data-testid="card">words</Card>);
    expect(screen.getByTestId('card')).toHaveAttribute('data-ground', 'plain');
  });

  it('renders the requested element', () => {
    render(<Card as="article">words</Card>);
    expect(screen.getByRole('article')).toHaveTextContent('words');
  });

  it('keeps the class a parent adds', () => {
    render(
      <Card className="extra" data-testid="card">
        words
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('extra');
  });
});
