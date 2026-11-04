import { createElement, useId, type InputHTMLAttributes, type Ref } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './TextField.module.css';

export interface TextFieldProps
  extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  /** Always visible. A placeholder never replaces it. */
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  /** A text area for longer messages. */
  readonly multiline?: boolean;
  readonly rows?: number;
  readonly ref?: Ref<HTMLInputElement | HTMLTextAreaElement>;
}

/**
 * A labeled field. Its direction follows what's typed, so Arabic and English both read right.
 * On the red ground, keep it inside a `Card`, so its small label and notes pass contrast.
 */
export function TextField({
  label,
  hint,
  error,
  multiline = false,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      {createElement(multiline ? 'textarea' : 'input', {
        dir: 'auto',
        ...rest,
        id: fieldId,
        className: styles.control,
        'aria-invalid': error !== undefined,
        ...(describedBy === '' ? {} : { 'aria-describedby': describedBy }),
      })}
      {hint !== undefined && (
        <p id={hintId} className={styles.note}>
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} className={styles.error}>
          <Icon name="alert" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
