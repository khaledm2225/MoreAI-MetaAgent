import { createElement, type ComponentPropsWithoutRef } from 'react';
import type { SpaceName } from '../../tokens';
import styles from './Stack.module.css';

export type StackDirection = 'column' | 'row';
export type StackElement = 'div' | 'section' | 'ul' | 'ol' | 'form' | 'nav' | 'header' | 'footer';

export interface StackProps extends ComponentPropsWithoutRef<'div'> {
  /** A row wraps onto new lines when it runs out of room. */
  readonly direction?: StackDirection;
  readonly gap?: SpaceName;
  readonly as?: StackElement;
}

/** Things in a line, with even gaps from the spacing scale. */
export function Stack({
  direction = 'column',
  gap = 'm',
  as = 'div',
  className,
  children,
  ...rest
}: StackProps) {
  return createElement(
    as,
    {
      ...rest,
      'data-direction': direction,
      'data-gap': gap,
      className: [styles.stack, className].filter(Boolean).join(' '),
    },
    children,
  );
}
