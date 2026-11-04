import type { ComponentPropsWithoutRef } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Banner.module.css';

export type BannerTone = 'info' | 'success' | 'error';

const icons: Readonly<Record<BannerTone, IconName>> = {
  info: 'info',
  success: 'check',
  error: 'alert',
};

export interface BannerProps extends ComponentPropsWithoutRef<'div'> {
  readonly tone?: BannerTone;
}

/** A message on a screen. An error interrupts a screen reader, anything else waits its turn. */
export function Banner({ tone = 'info', className, children, ...rest }: BannerProps) {
  return (
    <div
      {...rest}
      role={tone === 'error' ? 'alert' : 'status'}
      data-tone={tone}
      data-ground="plain"
      className={[styles.banner, className].filter(Boolean).join(' ')}
    >
      <Icon name={icons[tone]} className={styles.icon} />
      <div className={styles.words}>{children}</div>
    </div>
  );
}
