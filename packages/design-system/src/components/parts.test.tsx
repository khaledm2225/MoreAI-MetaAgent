import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AnimatedBullets } from './AnimatedBullets/AnimatedBullets';
import { Confetti } from './Confetti/Confetti';
import { EmptyState } from './EmptyState/EmptyState';
import { PhotoPicker } from './PhotoPicker/PhotoPicker';
import { ProgressBar } from './ProgressBar/ProgressBar';
import { QuantityStepper } from './QuantityStepper/QuantityStepper';
import { RatingStars } from './RatingStars/RatingStars';
import { StatusTimeline } from './StatusTimeline/StatusTimeline';
import { Switch } from './Switch/Switch';
import { Tabs } from './Tabs/Tabs';
import { TopBar } from './TopBar/TopBar';

describe('EmptyState', () => {
  it('explains the emptiness and offers the next step', () => {
    render(<EmptyState icon="bag" title="Nothing here" body="Add a piece" action={<button type="button">Shop</button>} />);
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByText('Add a piece')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shop' })).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('reports its value to screen readers and shows its words', () => {
    render(<ProgressBar label="Free orders" value={37} max={100} valueText="37 of 100" />);
    const bar = screen.getByRole('progressbar', { name: 'Free orders' });
    expect(bar).toHaveAttribute('aria-valuenow', '37');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '37 of 100');
    expect(screen.getByText('37 of 100')).toBeInTheDocument();
  });

  it('never goes past the end', () => {
    render(<ProgressBar label="Free orders" value={150} max={100} valueText="All" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Switch', () => {
  it('is named by its label and reports changes', async () => {
    const onChange = vi.fn();
    render(<Switch label="Marketing" checked={false} onChange={onChange} />);
    const control = screen.getByRole('switch', { name: 'Marketing' });
    expect(control).not.toBeChecked();
    await userEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('shows when it is on', () => {
    render(<Switch label="Marketing" checked onChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });
});

describe('QuantityStepper', () => {
  const props = { decreaseLabel: 'Less', increaseLabel: 'More', valueLabel: 'Quantity', min: 1, max: 3 };

  it('moves up and down', async () => {
    const onChange = vi.fn();
    render(<QuantityStepper {...props} value={2} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(onChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: 'Less' }));
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('stops at its limits', () => {
    const { rerender } = render(<QuantityStepper {...props} value={1} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Less' })).toBeDisabled();
    rerender(<QuantityStepper {...props} value={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'More' })).toBeDisabled();
  });

  it('announces the value', () => {
    render(<QuantityStepper {...props} value={2} onChange={() => {}} />);
    expect(screen.getByRole('status', { name: 'Quantity' })).toHaveTextContent('2');
  });
});

describe('RatingStars', () => {
  const labels = ['One', 'Two', 'Three', 'Four', 'Five'] as const;

  it('shows a rating with words for screen readers', () => {
    render(<RatingStars value={4} label="4 of 5 stars" />);
    expect(screen.getByRole('img', { name: '4 of 5 stars' })).toBeInTheDocument();
  });

  it('lets a person choose a rating', async () => {
    const onChange = vi.fn();
    render(<RatingStars value={0} label="Your rating" onChange={onChange} optionLabels={labels} />);
    const group = screen.getByRole('radiogroup', { name: 'Your rating' });
    await userEvent.click(within(group).getByRole('radio', { name: 'Four' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

describe('StatusTimeline', () => {
  it('names each step and marks the current one', () => {
    render(
      <StatusTimeline
        label="Order status"
        steps={[
          { id: 'a', label: 'Placed', state: 'done' },
          { id: 'b', label: 'Accepted', state: 'current' },
          { id: 'c', label: 'Delivered', state: 'upcoming' },
        ]}
      />,
    );
    const list = screen.getByRole('list', { name: 'Order status' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByText('Accepted').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('never uses color alone for a failed step', () => {
    const { container } = render(
      <StatusTimeline label="Order status" steps={[{ id: 'a', label: 'Rejected', state: 'failed' }]} />,
    );
    expect(container.querySelector('[data-icon="close"]')).toBeInTheDocument();
  });
});

describe('AnimatedBullets', () => {
  function Bullets() {
    const [items, setItems] = useState([{ id: 'a', content: 'Black' }]);
    return (
      <>
        <AnimatedBullets label="Preferences" items={items} />
        <button type="button" onClick={() => setItems([...items, { id: 'b', content: 'Oversized' }])}>
          Add
        </button>
      </>
    );
  }

  it('lists every preference', () => {
    render(<Bullets />);
    expect(within(screen.getByRole('list', { name: 'Preferences' })).getByText('Black')).toBeInTheDocument();
  });

  it('staggers the first items by their position', () => {
    render(<AnimatedBullets label="Preferences" items={[{ id: 'a', content: 'One' }, { id: 'b', content: 'Two' }]} />);
    const [first, second] = screen.getAllByRole('listitem');
    expect(first?.style.getPropertyValue('--bullet-index')).toBe('0');
    expect(second?.style.getPropertyValue('--bullet-index')).toBe('1');
  });

  it('pops a new item in alone, with no wait', async () => {
    render(<Bullets />);
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    const added = screen.getByText('Oversized').closest('li');
    expect(added?.style.getPropertyValue('--bullet-index')).toBe('0');
    expect(added).toHaveAttribute('data-new', 'true');
    expect(screen.getByText('Black').closest('li')).not.toHaveAttribute('data-new');
  });
});

describe('Confetti', () => {
  it('stays out of the way of screen readers and clicks', () => {
    const { container } = render(<Confetti />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('[data-piece]').length).toBeGreaterThan(10);
  });
});

describe('PhotoPicker', () => {
  const photo = new File(['photo'], 'outfit.jpg', { type: 'image/jpeg' });

  it('reports a chosen photo', async () => {
    const onPick = vi.fn();
    render(<PhotoPicker label="Choose a photo" hint="JPG or PNG" onPick={onPick} />);
    await userEvent.upload(screen.getByLabelText('Choose a photo'), photo);
    expect(onPick).toHaveBeenCalledWith(photo);
  });

  it('reports a dropped photo', () => {
    const onPick = vi.fn();
    render(<PhotoPicker label="Choose a photo" hint="JPG or PNG" onPick={onPick} data-testid="picker" />);
    fireEvent.drop(screen.getByTestId('picker'), { dataTransfer: { files: [photo] } });
    expect(onPick).toHaveBeenCalledWith(photo);
  });

  it('accepts only images', () => {
    render(<PhotoPicker label="Choose a photo" hint="JPG or PNG" onPick={() => {}} />);
    expect(screen.getByLabelText('Choose a photo')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });
});

describe('TopBar', () => {
  it('is the page banner, with its slots', () => {
    render(<TopBar start={<span>Logo</span>} end={<button type="button">Cart</button>} />);
    const bar = screen.getByRole('banner');
    expect(within(bar).getByText('Logo')).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Cart' })).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  const tabs = [
    { id: 'a', label: 'Live' },
    { id: 'b', label: 'Draft' },
    { id: 'c', label: 'Hidden' },
  ];

  it('marks the selected tab and reports a choice', async () => {
    const onSelect = vi.fn();
    render(<Tabs label="Status" tabs={tabs} selectedId="a" onSelect={onSelect} />);
    expect(screen.getByRole('tab', { name: 'Live' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Draft' }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('moves with the arrow keys and wraps around', async () => {
    const onSelect = vi.fn();
    render(<Tabs label="Status" tabs={tabs} selectedId="c" onSelect={onSelect} />);
    screen.getByRole('tab', { name: 'Hidden' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('keeps one tab in the keyboard order', () => {
    render(<Tabs label="Status" tabs={tabs} selectedId="b" onSelect={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Draft' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Live' })).toHaveAttribute('tabindex', '-1');
  });
});
