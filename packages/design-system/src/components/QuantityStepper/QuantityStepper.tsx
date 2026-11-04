import { IconButton } from '../IconButton/IconButton';
import styles from './QuantityStepper.module.css';

export interface QuantityStepperProps {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
  readonly decreaseLabel: string;
  readonly increaseLabel: string;
  readonly valueLabel: string;
}

export function QuantityStepper({
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
  valueLabel,
}: QuantityStepperProps) {
  return (
    <div className={styles.stepper}>
      <IconButton icon="minus" label={decreaseLabel} disabled={value <= min} onClick={() => onChange(value - 1)} />
      <span role="status" aria-label={valueLabel} className={styles.value}>
        {value}
      </span>
      <IconButton icon="plus" label={increaseLabel} disabled={value >= max} onClick={() => onChange(value + 1)} />
    </div>
  );
}
