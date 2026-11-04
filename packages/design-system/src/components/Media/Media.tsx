import { useState, type ComponentPropsWithoutRef } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Media.module.css';

export type MediaRatio = 'portrait' | 'square' | 'landscape';

export interface MediaProps extends ComponentPropsWithoutRef<'div'> {
  readonly src: string;
  /** What the image shows, for people who can't see it. */
  readonly alt: string;
  readonly ratio?: MediaRatio;
  /** Loads right away, for the first thing on a screen. */
  readonly priority?: boolean;
}

/** A photo that holds its shape while loading, and stays calm if it fails. */
export function Media({ src, alt, ratio = 'portrait', priority = false, className, ...rest }: MediaProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div
      {...rest}
      data-ratio={ratio}
      className={[styles.media, className].filter(Boolean).join(' ')}
    >
      {failedSrc === src ? (
        <div role="img" aria-label={alt} className={styles.fallback}>
          <Icon name="image" size="2rem" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={styles.image}
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  );
}
