import type { ReactNode } from 'react';

/** One state of a screen, shown on the review page without any data behind it. */
export interface StatePreview {
  readonly name: string;
  readonly element: ReactNode;
}

export interface ScreenPreviews {
  readonly screen: string;
  readonly states: readonly StatePreview[];
}
