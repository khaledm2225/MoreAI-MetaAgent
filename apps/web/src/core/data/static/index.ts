import type {
  AgentGateway,
  CampaignsRepository,
  CartRepository,
  CatalogRepository,
  FollowRepository,
  ListingAssistant,
  MerchantOrdersRepository,
  MerchantProductsRepository,
  MerchantProfileRepository,
  NotificationsRepository,
  OrdersRepository,
  PhotoToShopGateway,
  PreferencesRepository,
  ProductSearch,
  SessionRepository,
  SettingsRepository,
  ShopperRecordsRepository,
} from '../../domain/ports';
import { createStaticAgentGateway } from './agent';
import { createStaticListingAssistant, createStaticPhotoToShop } from './assistants';
import { DemoWorld, type DemoWorldOptions } from './demoWorld';
import {
  createCampaignsRepository,
  createCartRepository,
  createCatalogRepository,
  createFollowRepository,
  createMerchantOrdersRepository,
  createMerchantProductsRepository,
  createMerchantProfileRepository,
  createNotificationsRepository,
  createOrdersRepository,
  createPreferencesRepository,
  createProductSearch,
  createSessionRepository,
  createSettingsRepository,
  createShopperRecordsRepository,
} from './repositories';

export interface AppPorts {
  readonly session: SessionRepository;
  readonly catalog: CatalogRepository;
  readonly productSearch: ProductSearch;
  readonly follows: FollowRepository;
  readonly cart: CartRepository;
  readonly orders: OrdersRepository;
  readonly preferences: PreferencesRepository;
  readonly agent: AgentGateway;
  readonly photoToShop: PhotoToShopGateway;
  readonly notifications: NotificationsRepository;
  readonly settings: SettingsRepository;
  readonly merchantProfile: MerchantProfileRepository;
  readonly merchantProducts: MerchantProductsRepository;
  readonly listingAssistant: ListingAssistant;
  readonly merchantOrders: MerchantOrdersRepository;
  readonly shopperRecords: ShopperRecordsRepository;
  readonly campaigns: CampaignsRepository;
}

/** Every port, filled with static demo data. The backend replaces this one call later. */
export function createStaticPorts(options: DemoWorldOptions): AppPorts {
  const world = new DemoWorld(options);
  const productSearch = createProductSearch(world);
  const cart = createCartRepository(world);
  const orders = createOrdersRepository(world);
  return {
    session: createSessionRepository(world),
    catalog: createCatalogRepository(world),
    productSearch,
    follows: createFollowRepository(world),
    cart,
    orders,
    preferences: createPreferencesRepository(world),
    agent: createStaticAgentGateway({ world, search: productSearch, cart, orders }),
    photoToShop: createStaticPhotoToShop(world, productSearch),
    notifications: createNotificationsRepository(world),
    settings: createSettingsRepository(world),
    merchantProfile: createMerchantProfileRepository(world),
    merchantProducts: createMerchantProductsRepository(world),
    listingAssistant: createStaticListingAssistant(world),
    merchantOrders: createMerchantOrdersRepository(world),
    shopperRecords: createShopperRecordsRepository(world),
    campaigns: createCampaignsRepository(world),
  };
}
