import type { ComponentPropsWithRef } from 'react';
import styles from './Chip.module.css';

export interface ChipProps extends ComponentPropsWithRef<'button'> {
  readonly selected: boolean;
}

/** A small choice that turns on and off, such as a size or a filter. */
export function Chip({ selected, type = 'button', className, children, ...rest }: ChipProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-pressed={selected}
      className={[styles.chip, className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}
