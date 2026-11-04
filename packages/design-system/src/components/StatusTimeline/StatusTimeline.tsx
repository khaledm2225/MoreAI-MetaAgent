import { Icon, type IconName } from '../Icon/Icon';
import styles from './StatusTimeline.module.css';

export type TimelineStepState = 'done' | 'current' | 'upcoming' | 'failed';

export interface TimelineStep {
  readonly id: string;
  readonly label: string;
  readonly state: TimelineStepState;
}

export interface StatusTimelineProps {
  readonly label: string;
  readonly steps: readonly TimelineStep[];
}

const icons: Readonly<Record<TimelineStepState, IconName | null>> = {
  done: 'check',
  current: 'package',
  upcoming: null,
  failed: 'close',
};

/** The steps something moves through. Each has an icon and words, so color is never the only signal. */
export function StatusTimeline({ label, steps }: StatusTimelineProps) {
  return (
    <ol aria-label={label} className={styles.timeline}>
      {steps.map((step) => {
        const icon = icons[step.state];
        return (
          <li
            key={step.id}
            data-state={step.state}
            className={styles.step}
            {...(step.state === 'current' ? { 'aria-current': 'step' as const } : {})}
          >
            <span className={styles.dot}>{icon !== null && <Icon name={icon} size="1rem" />}</span>
            <span className={styles.label}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
