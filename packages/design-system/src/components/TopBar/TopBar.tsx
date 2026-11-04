import type { ReactNode } from 'react';
import { Container, type ContainerWidth } from '../Layout/Container';
import styles from './TopBar.module.css';

export interface TopBarProps {
  readonly start: ReactNode;
  readonly end?: ReactNode;
  readonly width?: ContainerWidth;
}

/** The bar at the top of a screen. It wraps onto 2 lines instead of overflowing on a phone. */
export function TopBar({ start, end, width = 'wide' }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <Container width={width} className={styles.inner}>
        <div className={styles.slot}>{start}</div>
        {end !== undefined && <div className={styles.slot}>{end}</div>}
      </Container>
    </header>
  );
}
