/**
 * The spacing scale, in pixels at the browser's default text size. The CSS holds
 * the same values in rem, so spacing grows with a person's text size.
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  /** Reads as a capsule on one line, and stays a soft shape when long words make it taller. */
  action: 30,
  card: 20,
} as const;

export const layout = {
  /** The smallest comfortable touch target. */
  minimumTouchSide: 44,
  /** How wide a screen's content may grow. */
  contentWidths: {
    reading: 672,
    regular: 1120,
    wide: 1440,
  },
} as const;

export type SpaceName = keyof typeof spacing;
