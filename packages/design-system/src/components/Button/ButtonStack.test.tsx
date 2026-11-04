import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { ButtonStack } from './ButtonStack';

describe('ButtonStack', () => {
  it('holds its buttons and shares the width equally by default', () => {
    render(
      <ButtonStack data-testid="stack">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonStack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('data-widths', 'equal');
    expect(stack).toContainElement(screen.getByRole('button', { name: 'One' }));
    expect(stack).toContainElement(screen.getByRole('button', { name: 'Two' }));
  });

  it('can let a compact button hug its words', () => {
    render(
      <ButtonStack widths="hugging" data-testid="stack">
        <Button size="compact">One</Button>
      </ButtonStack>,
    );
    expect(screen.getByTestId('stack')).toHaveAttribute('data-widths', 'hugging');
  });
});
