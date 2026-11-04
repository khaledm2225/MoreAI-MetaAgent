import type { Id } from './catalog';
import type { LocalizedText } from './text';

export type PreferenceKind = 'color' | 'size' | 'style' | 'budget';

/** One thing MoreAI knows about a shopper's taste, shown as a bullet in their account. */
export interface Preference {
  readonly id: Id;
  readonly kind: PreferenceKind;
  readonly text: LocalizedText;
  readonly source: 'agent' | 'shopper';
}
