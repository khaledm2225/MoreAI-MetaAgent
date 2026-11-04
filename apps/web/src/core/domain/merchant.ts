import type { Id, Merchant, Product } from './catalog';
import type { Order, OrderStatus } from './order';
import type { LocalizedText } from './text';

export interface MerchantJoinForm {
  readonly name: string;
  readonly bio: string;
  /** A URL the page can show, for the brand's image. */
  readonly imageUrl: string | null;
}

export interface MerchantDashboard {
  readonly merchant: Merchant;
  readonly ordersSoFar: number;
  readonly ordersToday: readonly Order[];
}

/** What the AI read from a product's photo, for the merchant to review before publishing. */
export interface ListingDraft {
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly visualDescription: string;
  readonly categoryId: Id;
  readonly colorCodes: readonly string[];
  readonly sizeLabels: readonly string[];
  readonly pricePiasters: number | null;
}

export interface ProductForm {
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly visualDescription: string;
  readonly categoryId: Id;
  readonly colorCodes: readonly string[];
  readonly sizeLabels: readonly string[];
  readonly pricePiasters: number;
  readonly stockPerVariant: number;
  readonly imageUrls: readonly string[];
}

export interface ShopperRecord {
  readonly shopperId: Id;
  readonly displayName: string;
  readonly ordersPlaced: number;
  readonly ordersReceived: number;
  readonly ordersRefused: number;
  readonly merchantRating: number | null;
  readonly isBlocked: boolean;
}

export type CampaignStatus = 'draft' | 'sent';

export interface Campaign {
  readonly id: Id;
  readonly title: string;
  readonly body: string;
  readonly status: CampaignStatus;
  readonly audienceSize: number;
  readonly opens: number;
  readonly orders: number;
  readonly sentAt: Date | null;
}

export interface CampaignAudience {
  readonly followers: number;
  readonly buyers: number;
  /** Only people who agreed to marketing can receive a push. */
  readonly withConsent: number;
}

export type { Merchant, Order, OrderStatus, Product };
