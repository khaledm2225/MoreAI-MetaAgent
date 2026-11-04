import styles from './Skeleton.module.css';

export type SkeletonShape = 'text' | 'block' | 'circle';

export interface SkeletonProps {
  readonly shape?: SkeletonShape;
  readonly className?: string;
}

/** Holds a place while content loads, so the page doesn't jump when it arrives. */
export function Skeleton({ shape = 'text', className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      data-shape={shape}
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
    />
  );
}
