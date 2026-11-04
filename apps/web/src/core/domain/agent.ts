import type { Id, Merchant, Product } from './catalog';
import type { Address, Order } from './order';
import type { Preference } from './taste';
import type { LocalizedText } from './text';

export type TraceKind = 'model' | 'tool';
export type TraceStatus = 'running' | 'done' | 'failed';

/** One step of the agent's work, shown live so a person can see what it's doing. */
export interface TraceStep {
  readonly id: Id;
  readonly kind: TraceKind;
  /** The real model or tool name, such as `muse-spark-1.3` or `search_catalog`. */
  readonly name: string;
  readonly summary: LocalizedText;
  readonly status: TraceStatus;
  readonly durationMs: number | null;
}

export interface SuggestedPiece {
  readonly product: Product;
  readonly merchant: Merchant;
  readonly reason: LocalizedText;
}

/** The agent never adds to the cart or places an order until the shopper answers one of these. */
export type ConfirmationRequest =
  | {
      readonly id: Id;
      readonly kind: 'addToCart';
      readonly question: LocalizedText;
      readonly pieces: readonly { readonly productId: Id; readonly variantId: Id; readonly quantity: number }[];
    }
  | {
      readonly id: Id;
      readonly kind: 'placeOrder';
      readonly question: LocalizedText;
      readonly totalPiasters: number;
    };

export type AgentEvent =
  | { readonly type: 'trace'; readonly step: TraceStep }
  | { readonly type: 'message'; readonly id: Id; readonly text: LocalizedText }
  | { readonly type: 'suggestions'; readonly id: Id; readonly pieces: readonly SuggestedPiece[] }
  | { readonly type: 'nothingFits'; readonly id: Id; readonly text: LocalizedText }
  | { readonly type: 'needsAddress'; readonly id: Id; readonly text: LocalizedText }
  | { readonly type: 'confirm'; readonly request: ConfirmationRequest }
  | { readonly type: 'preferenceLearned'; readonly preference: Preference }
  | { readonly type: 'orderPlaced'; readonly orders: readonly Order[] }
  | { readonly type: 'limitReached'; readonly text: LocalizedText };

export type AgentInput =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'chooseVariant'; readonly productId: Id; readonly variantId: Id }
  | { readonly kind: 'address'; readonly address: Address }
  | { readonly kind: 'confirmation'; readonly requestId: Id; readonly accepted: boolean };
