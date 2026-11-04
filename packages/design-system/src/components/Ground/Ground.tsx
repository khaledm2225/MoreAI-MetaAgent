import { createElement, type ComponentPropsWithoutRef } from 'react';
import styles from './Ground.module.css';

export type GroundKind = 'plain' | 'brand';
export type GroundElement = 'div' | 'main' | 'section' | 'header' | 'footer' | 'aside';

export interface GroundProps extends ComponentPropsWithoutRef<'div'> {
  /** `plain` is the cream page, the app's background. `brand` is the red, for big moments. */
  readonly kind?: GroundKind;
  readonly as?: GroundElement;
  /** At least as tall as the screen. */
  readonly fillViewport?: boolean;
}

/** Paints a part of a screen, and tells the components inside what they sit on. */
export function Ground({
  kind = 'plain',
  as = 'div',
  fillViewport = false,
  className,
  children,
  ...rest
}: GroundProps) {
  return createElement(
    as,
    {
      ...rest,
      'data-ground': kind,
      ...(fillViewport ? { 'data-fill-viewport': 'true' } : {}),
      className: [styles.ground, className].filter(Boolean).join(' '),
    },
    children,
  );
}
