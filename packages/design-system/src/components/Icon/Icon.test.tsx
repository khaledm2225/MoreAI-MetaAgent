import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('draws the named icon and hides it from screen readers', () => {
    const { container } = render(<Icon name="trash" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('data-icon', 'trash');
  });

  it.each(['arrowForward', 'arrowBack', 'chevronForward', 'chevronBack', 'send'] as const)('flips %s for right to left', (name) => {
    const { container } = render(<Icon name={name} />);
    expect(container.querySelector('svg')).toHaveAttribute('data-mirrored', 'true');
  });

  it('leaves an icon alone when direction means nothing for it', () => {
    const { container } = render(<Icon name="camera" />);
    expect(container.querySelector('svg')).not.toHaveAttribute('data-mirrored');
  });

  it('takes a size in pixels', () => {
    const { container } = render(<Icon name="trash" size={24} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
  });
});
