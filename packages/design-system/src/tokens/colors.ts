/** The colors, named by purpose, so a screen never picks a raw value. */
export const colors = {
  /** The page: the logo's cream. */
  background: '#F5ECD6',
  textPrimary: '#1C1412',
  textSecondary: '#4A3C34',
  /** Red that's safe for small text. The brand red itself only passes as large or bold text. */
  accentText: '#C8000F',
  /** Errors and deleting. Always next to an icon or words, never alone. */
  danger: '#B8000E',
  /** The one action a screen exists for. */
  actionFill: '#C8000F',
  onAction: '#F5ECD6',
  /** A calm button on the page. */
  tonalFill: '#EBDDBF',
  /** The red ground, edge to edge. */
  brandGround: '#F50A16',
  /** Words on the red ground. Large or bold only. */
  onBrandGround: '#F5ECD6',
  /** The main action on the red ground, where red would disappear. */
  brandAction: '#F5ECD6',
  onBrandAction: '#1C1412',
  /** A calm button on the red ground. */
  brandTonalFill: '#C8000F',
} as const;

export type ColorName = keyof typeof colors;
