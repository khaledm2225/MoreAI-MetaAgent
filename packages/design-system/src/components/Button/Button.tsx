import type { ComponentPropsWithRef } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Button.module.css';

export type ButtonProminence =
  /** The one action a screen exists for. Use it once or twice per screen. */
  | 'primary'
  /** An alternative next to the primary action. */
  | 'secondary'
  /** A low emphasis action, such as skip. */
  | 'quiet'
  /** An action that removes something. It never takes the action's red fill, and always shows an icon. */
  | 'destructive';

export type ButtonSize =
  /** As wide as its container. */
  | 'regular'
  /** As wide as its words. */
  | 'compact';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  readonly prominence?: ButtonProminence;
  readonly size?: ButtonSize;
  readonly icon?: IconName;
  readonly isLoading?: boolean;
}

export function Button({
  prominence = 'primary',
  size = 'regular',
  icon,
  isLoading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const resolvedIcon = icon ?? (prominence === 'destructive' ? 'trash' : undefined);
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || isLoading}
      data-prominence={prominence}
      data-size={size}
      {...(isLoading ? { 'aria-busy': true } : {})}
      className={[styles.button, className].filter(Boolean).join(' ')}
    >
      <span className={styles.content}>
        {resolvedIcon !== undefined && <Icon name={resolvedIcon} />}
        <span>{children}</span>
      </span>
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
}
