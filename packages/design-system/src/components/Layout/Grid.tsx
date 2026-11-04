import type { ComponentPropsWithoutRef } from 'react';
import type { SpaceName } from '../../tokens';
import styles from './Grid.module.css';

export type GridItemWidth = 'compact' | 'regular' | 'wide';

export interface GridProps extends ComponentPropsWithoutRef<'div'> {
  /** The narrowest a column may get before the grid drops to fewer columns. */
  readonly itemWidth?: GridItemWidth;
  readonly gap?: SpaceName;
}

/** A grid that picks its own number of columns from the room it has. */
export function Grid({ itemWidth = 'regular', gap = 'm', className, children, ...rest }: GridProps) {
  return (
    <div
      {...rest}
      data-item-width={itemWidth}
      data-gap={gap}
      className={[styles.grid, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
