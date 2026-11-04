import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from './Text';

describe('Text', () => {
  it('defaults to reading text in a paragraph', () => {
    render(<Text>words</Text>);
    const element = screen.getByText('words');
    expect(element.tagName).toBe('P');
    expect(element).toHaveAttribute('data-role', 'body');
  });

  it.each([
    ['hero', 1],
    ['display', 1],
    ['title', 2],
    ['section', 3],
    ['headline', 4],
  ] as const)('makes the %s role a heading of level %i', (role, level) => {
    render(<Text role={role}>words</Text>);
    expect(screen.getByRole('heading', { level })).toHaveAttribute('data-role', role);
  });

  it('lets the screen choose a different element without changing the look', () => {
    render(
      <Text role="title" as="h1">
        words
      </Text>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('data-role', 'title');
  });

  it('lets text of unknown direction find its own, such as a shopper\'s message', () => {
    render(<Text dir="auto">words</Text>);
    expect(screen.getByText('words')).toHaveAttribute('dir', 'auto');
  });

  it('passes tone to the styles', () => {
    render(<Text tone="secondary">words</Text>);
    expect(screen.getByText('words')).toHaveAttribute('data-tone', 'secondary');
  });
});
