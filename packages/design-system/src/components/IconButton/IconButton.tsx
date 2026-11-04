import type { ComponentPropsWithRef } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

export type IconButtonProminence = 'primary' | 'secondary' | 'quiet';

export interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  readonly icon: IconName;
  /** Names the button for screen readers, since it shows no words. */
  readonly label: string;
  readonly prominence?: IconButtonProminence;
}

export function IconButton({
  icon,
  label,
  prominence = 'secondary',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      data-prominence={prominence}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
    >
      <Icon name={icon} />
    </button>
  );
}
