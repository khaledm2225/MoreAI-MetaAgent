import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './AnimatedBullets.module.css';

export interface BulletItem {
  readonly id: string;
  readonly content: ReactNode;
}

export interface AnimatedBulletsProps {
  readonly label: string;
  readonly items: readonly BulletItem[];
}

/** A list that pops in one item after another. A new item later pops in alone, with no wait. */
export function AnimatedBullets({ label, items }: AnimatedBulletsProps) {
  const seen = useRef<ReadonlySet<string> | null>(null);
  const firstRender = seen.current === null;
  const known = seen.current ?? new Set<string>();

  useEffect(() => {
    seen.current = new Set(items.map(({ id }) => id));
  }, [items]);

  return (
    <ul aria-label={label} className={styles.list}>
      {items.map(({ id, content }, index) => {
        const isNew = !firstRender && !known.has(id);
        return (
          <li
            key={id}
            className={styles.item}
            style={{ '--bullet-index': firstRender ? index : 0 } as CSSProperties}
            {...(isNew ? { 'data-new': 'true' } : {})}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.content}>{content}</span>
          </li>
        );
      })}
    </ul>
  );
}
