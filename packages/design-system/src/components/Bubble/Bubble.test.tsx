import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Bubble } from './Bubble';

describe('Bubble', () => {
  it.each(['self', 'other'] as const)('marks who the %s message is from', (from) => {
    render(<Bubble from={from}>words</Bubble>);
    expect(screen.getByText('words')).toHaveAttribute('data-from', from);
  });

  it('lets a message find its own direction, for Arabic and English in one chat', () => {
    render(<Bubble from="self">words</Bubble>);
    expect(screen.getByText('words')).toHaveAttribute('dir', 'auto');
  });
});
