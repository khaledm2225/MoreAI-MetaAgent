import { createElement, type ComponentPropsWithoutRef } from 'react';
import styles from './Card.module.css';

export type CardElement = 'div' | 'article' | 'section' | 'aside' | 'li' | 'form';

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  readonly as?: CardElement;
}

/**
 * A cream surface for reading text and forms. Small text doesn't pass contrast
 * on the red ground in cream or near black, so it lives on one of these.
 */
export function Card({ as = 'div', className, children, ...rest }: CardProps) {
  return createElement(
    as,
    {
      ...rest,
      'data-ground': 'plain',
      className: [styles.card, className].filter(Boolean).join(' '),
    },
    children,
  );
}
