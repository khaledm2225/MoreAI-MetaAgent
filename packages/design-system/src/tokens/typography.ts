export type FontFamilyRole = 'heading' | 'body';

export interface TypeRole {
  readonly family: FontFamilyRole;
  readonly weight: number;
  readonly size: string;
}

/**
 * The type roles: Baloo Bhaijaan 2 for headings, Rubik for everything else, both
 * with Arabic and Latin letters. Sizes are in rem, so a person's text size and zoom apply.
 */
export const typography = {
  /** The huge words of a big moment, on the red ground. */
  hero: { family: 'heading', weight: 800, size: 'clamp(3rem, 1.5rem + 8vw, 6rem)' },
  /** The one statement a screen opens with. */
  display: { family: 'heading', weight: 800, size: '2.5rem' },
  /** A screen's title. */
  title: { family: 'heading', weight: 700, size: '1.75rem' },
  /** A section of a page. */
  section: { family: 'heading', weight: 700, size: '1.375rem' },
  /** A small heading, such as a card's title. */
  headline: { family: 'heading', weight: 600, size: '1.125rem' },
  /** Reading text. */
  body: { family: 'body', weight: 400, size: '1.0625rem' },
  /** The line under a heading. */
  supporting: { family: 'body', weight: 400, size: '0.9375rem' },
  /** A button's words. */
  button: { family: 'body', weight: 600, size: '1.0625rem' },
  /** Words on the bright red, where cream only passes as large, bold text. */
  strongButton: { family: 'body', weight: 700, size: '1.1875rem' },
  /** Chips and small labels. */
  label: { family: 'body', weight: 500, size: '0.8125rem' },
  /** The smallest text. */
  caption: { family: 'body', weight: 400, size: '0.75rem' },
} as const satisfies Record<string, TypeRole>;

export type TypeRoleName = keyof typeof typography;
