import type { ComponentPropsWithoutRef } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'calm' | 'strong';

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  readonly tone?: BadgeTone;
}

/** A small label that isn't pressable, such as a brand's name or a status. */
export function Badge({ tone = 'calm', className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      data-tone={tone}
      className={[styles.badge, className].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  );
}
