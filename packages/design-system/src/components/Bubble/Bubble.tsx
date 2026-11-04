import type { ComponentPropsWithoutRef } from 'react';
import styles from './Bubble.module.css';

export type BubbleFrom = 'self' | 'other';

export interface BubbleProps extends ComponentPropsWithoutRef<'div'> {
  readonly from: BubbleFrom;
}

/** A chat message. Place it in a column, and it sits on the right side for each language. */
export function Bubble({ from, className, children, ...rest }: BubbleProps) {
  return (
    <div
      dir="auto"
      {...rest}
      data-from={from}
      className={[styles.bubble, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
