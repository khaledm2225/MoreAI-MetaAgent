import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  readonly icon: IconName;
  readonly title: string;
  readonly body?: string;
  readonly action?: ReactNode;
}

/** What a screen shows when it has nothing yet, with the next step. */
export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} size="1.75rem" />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {body !== undefined && <p className={styles.body}>{body}</p>}
      {action}
    </div>
  );
}
