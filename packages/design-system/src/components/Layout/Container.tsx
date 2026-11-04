import { createElement, type ComponentPropsWithoutRef } from 'react';
import styles from './Container.module.css';

export type ContainerWidth = 'reading' | 'regular' | 'wide';
export type ContainerElement = 'div' | 'main' | 'section' | 'header' | 'footer' | 'nav';

export interface ContainerProps extends ComponentPropsWithoutRef<'div'> {
  readonly width?: ContainerWidth;
  readonly as?: ContainerElement;
}

/** Centers a screen's content, keeps it clear of the edges and a phone's notch, and limits its width. */
export function Container({ width = 'regular', as = 'div', className, children, ...rest }: ContainerProps) {
  return createElement(
    as,
    {
      ...rest,
      'data-width': width,
      className: [styles.container, className].filter(Boolean).join(' '),
    },
    children,
  );
}
