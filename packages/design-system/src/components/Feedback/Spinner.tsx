import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** Read by screen readers, so waiting is never silent. */
  readonly label: string;
  readonly className?: string;
}

export function Spinner({ label, className }: SpinnerProps) {
  return (
    <span role="status" className={className}>
      <span className={styles.spinner} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
