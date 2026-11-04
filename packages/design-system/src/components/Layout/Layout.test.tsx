import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container } from './Container';
import { Grid } from './Grid';
import { Stack } from './Stack';

describe('Container', () => {
  it('holds a screen at the regular width by default', () => {
    render(<Container data-testid="container">words</Container>);
    expect(screen.getByTestId('container')).toHaveAttribute('data-width', 'regular');
  });

  it.each(['reading', 'regular', 'wide'] as const)('takes the %s width', (width) => {
    render(
      <Container width={width} data-testid="container">
        words
      </Container>,
    );
    expect(screen.getByTestId('container')).toHaveAttribute('data-width', width);
  });

  it('renders the requested landmark', () => {
    render(<Container as="main">words</Container>);
    expect(screen.getByRole('main')).toHaveTextContent('words');
  });
});

describe('Stack', () => {
  it('stacks one above the other with medium gaps by default', () => {
    render(<Stack data-testid="stack">words</Stack>);
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('data-direction', 'column');
    expect(stack).toHaveAttribute('data-gap', 'm');
  });

  it('can run in a line and wrap', () => {
    render(
      <Stack direction="row" gap="xs" data-testid="stack">
        words
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('data-direction', 'row');
    expect(stack).toHaveAttribute('data-gap', 'xs');
  });

  it('renders the requested element', () => {
    render(<Stack as="section" aria-label="area">words</Stack>);
    expect(screen.getByRole('region', { name: 'area' })).toHaveTextContent('words');
  });
});

describe('Grid', () => {
  it('fits as many regular columns as the space allows', () => {
    render(<Grid data-testid="grid">words</Grid>);
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveAttribute('data-item-width', 'regular');
    expect(grid).toHaveAttribute('data-gap', 'm');
  });

  it.each(['compact', 'regular', 'wide'] as const)('takes the %s item width', (itemWidth) => {
    render(
      <Grid itemWidth={itemWidth} data-testid="grid">
        words
      </Grid>,
    );
    expect(screen.getByTestId('grid')).toHaveAttribute('data-item-width', itemWidth);
  });
});
