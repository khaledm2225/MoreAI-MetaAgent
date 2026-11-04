import { useId } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './RatingStars.module.css';

const STARS = [1, 2, 3, 4, 5] as const;

export interface RatingStarsProps {
  readonly value: number;
  /** Names the rating. When showing one, say the value in words, such as "4 of 5 stars". */
  readonly label: string;
  /** Makes it a control a person can use. */
  readonly onChange?: (value: number) => void;
  /** A name for each star, needed with `onChange`. */
  readonly optionLabels?: readonly [string, string, string, string, string];
}

export function RatingStars({ value, label, onChange, optionLabels }: RatingStarsProps) {
  const name = useId();
  if (onChange === undefined) {
    return (
      <span role="img" aria-label={label} className={styles.stars}>
        {STARS.map((star) => (
          <span key={star} className={star <= value ? styles.filled : undefined}>
            <Icon name="star" />
          </span>
        ))}
      </span>
    );
  }
  return (
    <div role="radiogroup" aria-label={label} className={styles.stars}>
      {STARS.map((star, index) => (
        <label
          key={star}
          className={[styles.option, star <= value ? styles.filled : null].filter(Boolean).join(' ')}
        >
          <input
            type="radio"
            name={name}
            checked={star === value}
            aria-label={optionLabels?.[index] ?? String(star)}
            onChange={() => onChange(star)}
          />
          <Icon name="star" size="1.75rem" />
        </label>
      ))}
    </div>
  );
}
