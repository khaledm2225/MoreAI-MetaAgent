import type { CSSProperties } from 'react';
import styles from './Confetti.module.css';

const PIECES = 36;
const PIECE_COLORS = ['var(--color-action-fill)', 'var(--color-tonal-fill)', 'var(--color-hairline)', 'var(--color-text-primary)'];

/** A short celebration when an order is placed. It's decoration, and never blocks a click. */
export function Confetti() {
  return (
    <div aria-hidden="true" className={styles.confetti}>
      {Array.from({ length: PIECES }, (_, index) => (
        <span
          key={index}
          data-piece
          className={styles.piece}
          style={
            {
              '--start': `${((index * 37) % 100).toString()}%`,
              '--wait': `${((index * 53) % 600).toString()}ms`,
              '--turn': `${((index * 97) % 720).toString()}deg`,
              '--piece-color': PIECE_COLORS[index % PIECE_COLORS.length],
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
