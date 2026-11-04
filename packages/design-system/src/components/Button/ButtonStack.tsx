import type { ComponentPropsWithoutRef } from 'react';
import styles from './ButtonStack.module.css';

export type ButtonStackWidths =
  /** Every button takes the same share of the row. */
  | 'equal'
  /** A compact button is as wide as its words, and a regular one takes what's left. */
  | 'hugging';

export interface ButtonStackProps extends ComponentPropsWithoutRef<'div'> {
  readonly widths?: ButtonStackWidths;
}

/** Buttons side by side where they fit, and one above the other where they don't. */
export function ButtonStack({ widths = 'equal', className, children, ...rest }: ButtonStackProps) {
  return (
    <div
      {...rest}
      data-widths={widths}
      className={[styles.stack, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
