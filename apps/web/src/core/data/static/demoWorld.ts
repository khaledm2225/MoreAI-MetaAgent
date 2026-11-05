import type { AppNotification, AppSettings, NotificationPreferences, Session } from '../../domain/account';
import type { Id, Merchant, Product, Size } from '../../domain/catalog';
import type { Campaign, ShopperRecord } from '../../domain/merchant';
import type { Order } from '../../domain/order';
import type { Preference } from '../../domain/taste';
import { buildDemoProducts, demoMerchants, demoSizes } from './demoCatalog';

export interface StoredCartLine {
  readonly id: Id;
  readonly productId: Id;
  readonly variantId: Id;
  readonly quantity: number;
  readonly addedUnitPricePiasters: number;
}

export interface StoredOrder extends Order {
  readonly shopperId: Id;
}

export const DEMO_SHOPPER_ID = 'demo-shopper';

export interface DemoWorldOptions {
  /** How long each answer pretends to take. Tests use 0. */
  readonly latencyMs: number;
  readonly clock: () => Date;
}

type Topic = 'cart' | 'orders' | 'preferences' | 'settings';

/** All the demo's data in memory, so a change in one place shows up everywhere. */
export class DemoWorld {
  merchants: readonly Merchant[] = demoMerchants;
  products: readonly Product[] = buildDemoProducts();
  sizes: readonly Size[] = demoSizes;
  cart: readonly StoredCartLine[] = [];
  orders: readonly StoredOrder[] = [];
  preferences: readonly Preference[] = [];
  following: ReadonlySet<Id> = new Set();
  notifications: readonly AppNotification[] = [];
  notificationPreferences: NotificationPreferences = { marketingConsent: false, mutedMerchantIds: [] };
  settings: AppSettings = { showMoreAiButton: true };
  session: Session = { role: null, clientGatePassed: false, merchantId: null, accountDeleted: false };
  shopperRecords: readonly ShopperRecord[] = [];
  /** Brand id to the shoppers it stopped accepting. */
  blocked: ReadonlyMap<Id, ReadonlySet<Id>> = new Map();
  campaigns: readonly Campaign[] = [];

  private nextIdNumber = 1;
  private readonly listeners: Readonly<Record<Topic, Set<() => void>>> = {
    cart: new Set(),
    orders: new Set(),
    preferences: new Set(),
    settings: new Set(),
  };

  constructor(private readonly options: DemoWorldOptions) {}

  now(): Date {
    return this.options.clock();
  }

  nextId(prefix: string): Id {
    const id = `${prefix}-new-${String(this.nextIdNumber)}`;
    this.nextIdNumber += 1;
    return id;
  }

  /** Lets a screen show its loading state, as it would with a real server. */
  wait(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.options.latencyMs);
    });
  }

  subscribe(topic: Topic, listener: () => void): () => void {
    this.listeners[topic].add(listener);
    return () => {
      this.listeners[topic].delete(listener);
    };
  }

  notify(topic: Topic): void {
    for (const listener of this.listeners[topic]) {
      listener();
    }
  }

  productById(id: Id): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  merchantById(id: Id): Merchant | undefined {
    return this.merchants.find((merchant) => merchant.id === id);
  }

  replaceProduct(product: Product): void {
    this.products = this.products.some(({ id }) => id === product.id)
      ? this.products.map((item) => (item.id === product.id ? product : item))
      : [...this.products, product];
  }

  replaceOrder(order: StoredOrder): void {
    this.orders = this.orders.map((item) => (item.id === order.id ? order : item));
    this.notify('orders');
  }
}
