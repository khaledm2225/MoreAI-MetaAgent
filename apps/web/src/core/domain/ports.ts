import type { AppNotification, AppSettings, ClientRole, NotificationPreferences, Session } from './account';
import type { AgentEvent, AgentInput } from './agent';
import type { CartLine } from './cart';
import type { Category, Color, Id, Merchant, Product, Size } from './catalog';
import type {
  Campaign,
  CampaignAudience,
  ListingDraft,
  MerchantDashboard,
  MerchantJoinForm,
  ProductForm,
  ShopperRecord,
} from './merchant';
import type { Address, Order, OrderRating, OrderStatus, PlaceOrderResult } from './order';
import type { ProductQuery } from './search';
import type { Preference } from './taste';
import type { DetectedPiece, PhotoInput, SimilarPiece } from './vision';

/**
 * Every outside dependency the screens have. Phase 1 fills these with static demo
 * data, and the backend later replaces only the implementations, in `app/container.ts`.
 */

export type Unsubscribe = () => void;

export interface SessionRepository {
  current(): Promise<Session>;
  chooseRole(role: ClientRole): Promise<Session>;
  passClientGate(): Promise<Session>;
  deleteAccount(): Promise<Session>;
}

export interface CatalogRepository {
  listMerchants(): Promise<readonly Merchant[]>;
  getMerchant(id: Id): Promise<Merchant | null>;
  listProducts(merchantId?: Id): Promise<readonly Product[]>;
  getProduct(id: Id): Promise<Product | null>;
  listCategories(): Promise<readonly Category[]>;
  listColors(): Promise<readonly Color[]>;
  listSizes(): Promise<readonly Size[]>;
}

/** Hard filters in code, closest match first. Vectors plug in behind this later. */
export interface ProductSearch {
  search(query: ProductQuery): Promise<readonly Product[]>;
}

export interface FollowRepository {
  isFollowing(merchantId: Id): Promise<boolean>;
  setFollowing(merchantId: Id, following: boolean): Promise<void>;
}

export interface CartRepository {
  listLines(): Promise<readonly CartLine[]>;
  addPiece(productId: Id, variantId: Id, quantity: number): Promise<void>;
  setQuantity(lineId: Id, quantity: number): Promise<void>;
  removeLine(lineId: Id): Promise<void>;
  /** Called whenever the cart changes, such as when the agent adds a piece. */
  subscribe(listener: () => void): Unsubscribe;
}

export interface OrdersRepository {
  /** One order per brand, after checking the daily limits and blocked brands. */
  placeOrder(address: Address): Promise<PlaceOrderResult>;
  listOrders(): Promise<readonly Order[]>;
  getOrder(id: Id): Promise<Order | null>;
  rateOrder(id: Id, rating: OrderRating): Promise<Order>;
  /** Called whenever an order changes, such as when a brand accepts it. */
  subscribe(listener: () => void): Unsubscribe;
}

export interface PreferencesRepository {
  list(): Promise<readonly Preference[]>;
  add(preference: Pick<Preference, 'kind' | 'text'>): Promise<Preference>;
  remove(id: Id): Promise<void>;
  /** Called whenever a preference changes, such as when the agent learns one. */
  subscribe(listener: () => void): Unsubscribe;
}

export interface AgentGateway {
  /** Sends one thing to the agent, and yields everything it does in response, as it happens. */
  send(input: AgentInput): AsyncIterable<AgentEvent>;
}

export interface PhotoToShopGateway {
  detectPieces(photo: PhotoInput): Promise<readonly DetectedPiece[]>;
  findSimilar(piece: DetectedPiece): Promise<readonly SimilarPiece[]>;
}

export interface NotificationsRepository {
  list(): Promise<readonly AppNotification[]>;
  markRead(id: Id): Promise<void>;
  preferences(): Promise<NotificationPreferences>;
  setMarketingConsent(consent: boolean): Promise<NotificationPreferences>;
  setMerchantMuted(merchantId: Id, muted: boolean): Promise<NotificationPreferences>;
}

export interface SettingsRepository {
  current(): Promise<AppSettings>;
  setShowMoreAiButton(show: boolean): Promise<AppSettings>;
  /** Called whenever a setting changes, such as hiding the MoreAI button. */
  subscribe(listener: () => void): Unsubscribe;
}

export interface MerchantProfileRepository {
  join(form: MerchantJoinForm): Promise<Merchant>;
  current(): Promise<Merchant | null>;
  dashboard(): Promise<MerchantDashboard>;
}

export interface MerchantProductsRepository {
  list(): Promise<readonly Product[]>;
  saveDraft(form: ProductForm): Promise<Product>;
  publish(form: ProductForm): Promise<Product>;
  setStatus(productId: Id, status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED'): Promise<Product>;
}

export interface ListingAssistant {
  /** Reads a product's photo with the AI, and returns details for the merchant to review. */
  readPhoto(photo: PhotoInput): Promise<ListingDraft>;
}

export interface MerchantOrdersRepository {
  list(): Promise<readonly Order[]>;
  moveOrder(orderId: Id, status: OrderStatus): Promise<Order>;
  subscribe(listener: () => void): Unsubscribe;
}

export interface ShopperRecordsRepository {
  list(): Promise<readonly ShopperRecord[]>;
  rate(shopperId: Id, stars: number): Promise<ShopperRecord>;
  setBlocked(shopperId: Id, blocked: boolean): Promise<ShopperRecord>;
}

export interface CampaignsRepository {
  list(): Promise<readonly Campaign[]>;
  audience(): Promise<CampaignAudience>;
  send(title: string, body: string): Promise<Campaign>;
}
