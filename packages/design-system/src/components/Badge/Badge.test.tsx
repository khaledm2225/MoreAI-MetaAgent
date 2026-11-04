import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('shows its words in the calm tone by default', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toHaveAttribute('data-tone', 'calm');
  });

  it('can stand out', () => {
    render(<Badge tone="strong">New</Badge>);
    expect(screen.getByText('New')).toHaveAttribute('data-tone', 'strong');
  });
});
