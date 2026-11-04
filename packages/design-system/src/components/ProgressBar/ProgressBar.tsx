import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  readonly label: string;
  readonly value: number;
  readonly max: number;
  /** The progress in words, shown and read out, such as "37 of 100". */
  readonly valueText: string;
}

export function ProgressBar({ label, value, max, valueText }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  return (
    <div className={styles.wrapper}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-valuetext={valueText}
        className={styles.track}
      >
        <div className={styles.fill} style={{ inlineSize: `${(clamped / max) * 100}%` }} />
      </div>
      <span className={styles.text}>{valueText}</span>
    </div>
  );
}
