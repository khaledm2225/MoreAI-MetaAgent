import type { AppNotification } from '../../domain/account';
import { cartTotalPiasters, type CartLine } from '../../domain/cart';
import type { Id, Merchant, Product, ProductVariant } from '../../domain/catalog';
import type { MerchantJoinForm, ProductForm, ShopperRecord } from '../../domain/merchant';
import { canMoveOrder, canRateOrder, checkOrderLimits, type Address, type Order, type OrderItem, type OrderRating, type OrderStatus, type PlaceOrderResult } from '../../domain/order';
import type {
  CampaignsRepository,
  CartRepository,
  CatalogRepository,
  FollowRepository,
  MerchantOrdersRepository,
  MerchantProductsRepository,
  MerchantProfileRepository,
  NotificationsRepository,
  OrdersRepository,
  PreferencesRepository,
  ProductSearch,
  SessionRepository,
  SettingsRepository,
  ShopperRecordsRepository,
} from '../../domain/ports';
import { isBuyable, priceOfVariant, searchProducts } from '../../domain/search';
import { demoCategories, demoColors, demoSizes } from './demoCatalog';
import { DEMO_SHOPPER_ID, type DemoWorld, type StoredCartLine, type StoredOrder } from './demoWorld';
import { productArtUrl } from './productArt';

const lookups = { colors: demoColors, sizes: demoSizes };

function required<T>(value: T | undefined | null, what: string): T {
  if (value === undefined || value === null) {
    throw new Error(`${what} doesn't exist.`);
  }
  return value;
}

export function createSessionRepository(world: DemoWorld): SessionRepository {
  return {
    current: async () => {
      await world.wait();
      return world.session;
    },
    chooseRole: async (role) => {
      await world.wait();
      world.session = { ...world.session, role };
      return world.session;
    },
    passClientGate: async () => {
      await world.wait();
      world.session = { ...world.session, clientGatePassed: true };
      return world.session;
    },
    deleteAccount: async () => {
      await world.wait();
      world.session = { role: null, clientGatePassed: false, merchantId: null, accountDeleted: true };
      world.cart = [];
      world.preferences = [];
      world.notify('cart');
      world.notify('preferences');
      return world.session;
    },
  };
}

export function createCatalogRepository(world: DemoWorld): CatalogRepository {
  return {
    listMerchants: async () => {
      await world.wait();
      return world.merchants.filter(({ status }) => status === 'LIVE');
    },
    getMerchant: async (id) => {
      await world.wait();
      return world.merchantById(id) ?? null;
    },
    listProducts: async (merchantId) => {
      await world.wait();
      return world.products.filter(
        (product) => product.status === 'ACTIVE' && (merchantId === undefined || product.merchantId === merchantId),
      );
    },
    getProduct: async (id) => {
      await world.wait();
      return world.productById(id) ?? null;
    },
    listCategories: async () => {
      await world.wait();
      return demoCategories;
    },
    listColors: async () => {
      await world.wait();
      return demoColors;
    },
    listSizes: async () => {
      await world.wait();
      return demoSizes;
    },
  };
}

export function createProductSearch(world: DemoWorld): ProductSearch {
  return {
    search: async (query) => {
      await world.wait();
      return searchProducts(world.products, query, lookups);
    },
  };
}

export function createFollowRepository(world: DemoWorld): FollowRepository {
  return {
    isFollowing: async (merchantId) => {
      await world.wait();
      return world.following.has(merchantId);
    },
    setFollowing: async (merchantId, following) => {
      await world.wait();
      const next = new Set(world.following);
      if (following) {
        next.add(merchantId);
      } else {
        next.delete(merchantId);
      }
      world.following = next;
    },
  };
}

function variantOf(product: Product, variantId: Id): ProductVariant {
  return required(product.variants.find(({ id }) => id === variantId), `Variant ${variantId}`);
}

function viewOfLine(world: DemoWorld, line: StoredCartLine): CartLine {
  const product = required(world.productById(line.productId), `Product ${line.productId}`);
  const merchant = required(world.merchantById(product.merchantId), `Merchant ${product.merchantId}`);
  const variant = variantOf(product, line.variantId);
  const color = demoColors.find(({ id }) => id === variant.colorId);
  const size = demoSizes.find(({ id }) => id === variant.sizeId);
  const unitPricePiasters = priceOfVariant(product, variant);
  const canBuy = product.status === 'ACTIVE' && isBuyable(variant) && variant.stockQuantity >= line.quantity;
  return {
    id: line.id,
    productId: line.productId,
    variantId: line.variantId,
    merchantId: merchant.id,
    merchantName: merchant.name,
    productName: product.name,
    colorName: color?.name ?? { en: '', ar: '' },
    sizeLabel: size?.label ?? '',
    imagePath: product.images[0]?.path ?? null,
    unitPricePiasters,
    quantity: line.quantity,
    availability: canBuy ? 'available' : 'soldOut',
    previousUnitPricePiasters: unitPricePiasters === line.addedUnitPricePiasters ? null : line.addedUnitPricePiasters,
  };
}

export function createCartRepository(world: DemoWorld): CartRepository {
  return {
    listLines: async () => {
      await world.wait();
      return world.cart.map((line) => viewOfLine(world, line));
    },
    addPiece: async (productId, variantId, quantity) => {
      await world.wait();
      const product = required(world.productById(productId), `Product ${productId}`);
      const existing = world.cart.find((line) => line.variantId === variantId);
      world.cart = existing
        ? world.cart.map((line) =>
            line.id === existing.id ? { ...line, quantity: line.quantity + quantity } : line,
          )
        : [
            ...world.cart,
            {
              id: world.nextId('line'),
              productId,
              variantId,
              quantity,
              addedUnitPricePiasters: priceOfVariant(product, variantOf(product, variantId)),
            },
          ];
      world.notify('cart');
    },
    setQuantity: async (lineId, quantity) => {
      await world.wait();
      world.cart = world.cart.map((line) => (line.id === lineId ? { ...line, quantity } : line));
      world.notify('cart');
    },
    removeLine: async (lineId) => {
      await world.wait();
      world.cart = world.cart.filter(({ id }) => id !== lineId);
      world.notify('cart');
    },
    subscribe: (listener) => world.subscribe('cart', listener),
  };
}

function isSameCairoDay(first: Date, second: Date): boolean {
  const day = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  return day(first) === day(second);
}

function addNotification(world: DemoWorld, notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): void {
  world.notifications = [
    { ...notification, id: world.nextId('notification'), createdAt: world.now(), isRead: false },
    ...world.notifications,
  ];
}

function placeOrders(world: DemoWorld, address: Address): PlaceOrderResult {
  const lines = world.cart.map((line) => viewOfLine(world, line));
  if (lines.length === 0) {
    return { kind: 'empty' };
  }
  if (lines.some(({ availability, previousUnitPricePiasters }) => availability === 'soldOut' || previousUnitPricePiasters !== null)) {
    return { kind: 'changed' };
  }
  const merchantIds = [...new Set(lines.map(({ merchantId }) => merchantId))];
  const blockedBy = merchantIds.find((merchantId) => world.blocked.get(merchantId)?.has(DEMO_SHOPPER_ID));
  if (blockedBy !== undefined) {
    return { kind: 'blocked', merchantId: blockedBy };
  }
  const now = world.now();
  const placedToday = world.orders
    .filter(({ shopperId, placedAt }) => shopperId === DEMO_SHOPPER_ID && isSameCairoDay(placedAt, now))
    .map(({ merchantId }) => merchantId);
  const limits = checkOrderLimits({ placedToday, merchantIds });
  if (!limits.allowed) {
    return limits.reason === 'BRAND_DAILY_LIMIT'
      ? { kind: 'dailyLimit', reason: limits.reason, merchantId: limits.merchantId }
      : { kind: 'dailyLimit', reason: limits.reason };
  }

  const orders: StoredOrder[] = merchantIds.map((merchantId) => {
    const merchant = required(world.merchantById(merchantId), `Merchant ${merchantId}`);
    const items: OrderItem[] = lines
      .filter((line) => line.merchantId === merchantId)
      .map((line) => ({
        id: world.nextId('item'),
        productId: line.productId,
        variantId: line.variantId,
        productName: line.productName,
        colorName: line.colorName,
        sizeLabel: line.sizeLabel,
        imagePath: line.imagePath,
        unitPricePiasters: line.unitPricePiasters,
        quantity: line.quantity,
        lineTotalPiasters: line.unitPricePiasters * line.quantity,
      }));
    const subtotalPiasters = items.reduce((total, item) => total + item.lineTotalPiasters, 0);
    return {
      id: world.nextId('order'),
      orderNumber: `M${String(1000 + world.orders.length + merchantIds.indexOf(merchantId))}`,
      shopperId: DEMO_SHOPPER_ID,
      merchantId,
      merchantName: merchant.name,
      status: 'PLACED',
      items,
      subtotalPiasters,
      deliveryFeePiasters: merchant.deliveryFeePiasters,
      totalPiasters: subtotalPiasters + merchant.deliveryFeePiasters,
      address,
      placedAt: now,
      rating: null,
    };
  });

  for (const line of world.cart) {
    const product = required(world.productById(line.productId), `Product ${line.productId}`);
    world.replaceProduct({
      ...product,
      variants: product.variants.map((variant) =>
        variant.id === line.variantId ? { ...variant, stockQuantity: variant.stockQuantity - line.quantity } : variant,
      ),
    });
  }
  world.orders = [...orders, ...world.orders];
  world.cart = [];
  for (const order of orders) {
    addNotification(world, {
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      kind: 'order',
      title: { en: 'Order placed', ar: 'الأوردر اتطلب' },
      body: {
        en: `${order.merchantName} received your order ${order.orderNumber}.`,
        ar: `${order.merchantName} استلم الأوردر ${order.orderNumber}.`,
      },
    });
  }
  world.notify('cart');
  world.notify('orders');
  return { kind: 'placed', orders };
}

/** What the cart will cost, including one delivery fee per brand. */
export function cartGrandTotal(world: DemoWorld): number {
  const lines = world.cart.map((line) => viewOfLine(world, line));
  const merchantIds = [...new Set(lines.map(({ merchantId }) => merchantId))];
  const fees = merchantIds.reduce(
    (total, merchantId) => total + (world.merchantById(merchantId)?.deliveryFeePiasters ?? 0),
    0,
  );
  return cartTotalPiasters(lines) + fees;
}

export function createOrdersRepository(world: DemoWorld): OrdersRepository {
  const mine = () => world.orders.filter(({ shopperId }) => shopperId === DEMO_SHOPPER_ID);
  return {
    placeOrder: async (address) => {
      await world.wait();
      return placeOrders(world, address);
    },
    listOrders: async () => {
      await world.wait();
      return mine();
    },
    getOrder: async (id) => {
      await world.wait();
      return mine().find((order) => order.id === id) ?? null;
    },
    rateOrder: async (id, rating: OrderRating) => {
      await world.wait();
      const order = required(mine().find((item) => item.id === id), `Order ${id}`);
      if (!canRateOrder(order)) {
        throw new Error('This order can only be rated once, after it is delivered.');
      }
      const rated = { ...order, rating };
      world.replaceOrder(rated);
      return rated;
    },
    subscribe: (listener) => world.subscribe('orders', listener),
  };
}

export function createPreferencesRepository(world: DemoWorld): PreferencesRepository {
  return {
    list: async () => {
      await world.wait();
      return world.preferences;
    },
    add: async ({ kind, text }) => {
      await world.wait();
      const preference = { id: world.nextId('preference'), kind, text, source: 'shopper' as const };
      world.preferences = [...world.preferences, preference];
      world.notify('preferences');
      return preference;
    },
    remove: async (id) => {
      await world.wait();
      world.preferences = world.preferences.filter((preference) => preference.id !== id);
      world.notify('preferences');
    },
    subscribe: (listener) => world.subscribe('preferences', listener),
  };
}

export function createNotificationsRepository(world: DemoWorld): NotificationsRepository {
  return {
    list: async () => {
      await world.wait();
      return world.notifications;
    },
    markRead: async (id) => {
      await world.wait();
      world.notifications = world.notifications.map((item) => (item.id === id ? { ...item, isRead: true } : item));
    },
    preferences: async () => {
      await world.wait();
      return world.notificationPreferences;
    },
    setMarketingConsent: async (marketingConsent) => {
      await world.wait();
      world.notificationPreferences = { ...world.notificationPreferences, marketingConsent };
      return world.notificationPreferences;
    },
    setMerchantMuted: async (merchantId, muted) => {
      await world.wait();
      const others = world.notificationPreferences.mutedMerchantIds.filter((id) => id !== merchantId);
      world.notificationPreferences = {
        ...world.notificationPreferences,
        mutedMerchantIds: muted ? [...others, merchantId] : others,
      };
      return world.notificationPreferences;
    },
  };
}

export function createSettingsRepository(world: DemoWorld): SettingsRepository {
  return {
    current: async () => {
      await world.wait();
      return world.settings;
    },
    setShowMoreAiButton: async (showMoreAiButton) => {
      await world.wait();
      world.settings = { ...world.settings, showMoreAiButton };
      world.notify('settings');
      return world.settings;
    },
    subscribe: (listener) => world.subscribe('settings', listener),
  };
}

function currentMerchantId(world: DemoWorld): Id {
  return required(world.session.merchantId, 'The merchant');
}

function sampleShoppers(world: DemoWorld): readonly ShopperRecord[] {
  return [
    { shopperId: world.nextId('shopper'), displayName: 'Mariam A.', ordersPlaced: 5, ordersReceived: 5, ordersRefused: 0, merchantRating: null, isBlocked: false },
    { shopperId: world.nextId('shopper'), displayName: 'Omar H.', ordersPlaced: 3, ordersReceived: 2, ordersRefused: 1, merchantRating: null, isBlocked: false },
    { shopperId: world.nextId('shopper'), displayName: 'Salma K.', ordersPlaced: 6, ordersReceived: 0, ordersRefused: 6, merchantRating: null, isBlocked: false },
  ];
}

export function createMerchantProfileRepository(world: DemoWorld): MerchantProfileRepository {
  return {
    join: async (form: MerchantJoinForm) => {
      await world.wait();
      const id = world.nextId('merchant');
      const merchant: Merchant = {
        id,
        slug: form.name.trim().toLowerCase().replaceAll(/\s+/g, '-'),
        name: form.name.trim(),
        bio: { en: form.bio, ar: form.bio },
        logoPath: form.imageUrl,
        status: 'LIVE',
        deliveryFeePiasters: 5_000,
      };
      world.merchants = [...world.merchants, merchant];
      world.session = { ...world.session, role: 'merchant', merchantId: id };
      world.shopperRecords = sampleShoppers(world);
      return merchant;
    },
    current: async () => {
      await world.wait();
      return world.session.merchantId === null ? null : (world.merchantById(world.session.merchantId) ?? null);
    },
    dashboard: async () => {
      await world.wait();
      const merchantId = currentMerchantId(world);
      const merchantOrders = world.orders.filter((order) => order.merchantId === merchantId);
      return {
        merchant: required(world.merchantById(merchantId), `Merchant ${merchantId}`),
        ordersSoFar: merchantOrders.length,
        ordersToday: merchantOrders.filter(({ placedAt }) => isSameCairoDay(placedAt, world.now())),
      };
    },
  };
}

function productFromForm(world: DemoWorld, form: ProductForm, status: Product['status']): Product {
  const id = world.nextId('product');
  const category = demoCategories.find(({ id: categoryId }) => categoryId === form.categoryId);
  const firstColor = demoColors.find(({ code }) => code === form.colorCodes[0]);
  const fallbackImage = productArtUrl(category?.slug ?? 'sweatshirts', firstColor?.hex ?? '#26201E');
  const imagePaths = form.imageUrls.length > 0 ? form.imageUrls : [fallbackImage];
  const variants = form.colorCodes.flatMap((code) =>
    form.sizeLabels.map((label) => ({
      id: `${id}-${code}-${label}`,
      productId: id,
      colorId: `color-${code}`,
      sizeId: demoSizes.find((size) => size.label === label)?.id ?? `size-${label}`,
      pricePiasters: null,
      stockQuantity: form.stockPerVariant,
      isAvailable: true,
    })),
  );
  return {
    id,
    merchantId: currentMerchantId(world),
    categoryId: form.categoryId,
    name: form.name,
    description: form.description,
    visualDescription: form.visualDescription,
    gender: 'UNISEX',
    status,
    pricePiasters: form.pricePiasters,
    images: imagePaths.map((path, position) => ({ id: `${id}-image-${String(position)}`, path, alt: form.name, position })),
    variants,
  };
}

export function createMerchantProductsRepository(world: DemoWorld): MerchantProductsRepository {
  function save(form: ProductForm, status: Product['status']): Product {
    const product = productFromForm(world, form, status);
    world.replaceProduct(product);
    return product;
  }
  return {
    list: async () => {
      await world.wait();
      return world.products.filter(({ merchantId }) => merchantId === currentMerchantId(world));
    },
    saveDraft: async (form) => {
      await world.wait();
      return save(form, 'DRAFT');
    },
    publish: async (form) => {
      await world.wait();
      return save(form, 'ACTIVE');
    },
    setStatus: async (productId, status) => {
      await world.wait();
      const product = { ...required(world.productById(productId), `Product ${productId}`), status };
      world.replaceProduct(product);
      return product;
    },
  };
}

export function createMerchantOrdersRepository(world: DemoWorld): MerchantOrdersRepository {
  return {
    list: async () => {
      await world.wait();
      return world.orders.filter(({ merchantId }) => merchantId === currentMerchantId(world));
    },
    moveOrder: async (orderId: Id, status: OrderStatus): Promise<Order> => {
      await world.wait();
      const order = required(world.orders.find(({ id }) => id === orderId), `Order ${orderId}`);
      if (!canMoveOrder(order.status, status)) {
        throw new Error(`An order can't move from ${order.status} to ${status}.`);
      }
      const moved = { ...order, status };
      addNotification(world, {
        merchantId: order.merchantId,
        merchantName: order.merchantName,
        kind: 'order',
        title: { en: 'Your order was updated', ar: 'الأوردر بتاعك اتحدث' },
        body: { en: `${order.merchantName} updated order ${order.orderNumber}.`, ar: `${order.merchantName} حدّث الأوردر ${order.orderNumber}.` },
      });
      world.replaceOrder(moved);
      return moved;
    },
    subscribe: (listener) => world.subscribe('orders', listener),
  };
}

export function createShopperRecordsRepository(world: DemoWorld): ShopperRecordsRepository {
  function update(shopperId: Id, change: Partial<ShopperRecord>): ShopperRecord {
    const record = { ...required(world.shopperRecords.find((item) => item.shopperId === shopperId), `Shopper ${shopperId}`), ...change };
    world.shopperRecords = world.shopperRecords.map((item) => (item.shopperId === shopperId ? record : item));
    return record;
  }
  return {
    list: async () => {
      await world.wait();
      return world.shopperRecords;
    },
    rate: async (shopperId, stars) => {
      await world.wait();
      return update(shopperId, { merchantRating: stars });
    },
    setBlocked: async (shopperId, blocked) => {
      await world.wait();
      const merchantId = currentMerchantId(world);
      const shoppers = new Set(world.blocked.get(merchantId) ?? []);
      if (blocked) {
        shoppers.add(shopperId);
      } else {
        shoppers.delete(shopperId);
      }
      world.blocked = new Map(world.blocked).set(merchantId, shoppers);
      return update(shopperId, { isBlocked: blocked });
    },
  };
}

const DEMO_AUDIENCE = { followers: 120, buyers: 48, withConsent: 86 };

export function createCampaignsRepository(world: DemoWorld): CampaignsRepository {
  return {
    list: async () => {
      await world.wait();
      return world.campaigns;
    },
    audience: async () => {
      await world.wait();
      return DEMO_AUDIENCE;
    },
    send: async (title, body) => {
      await world.wait();
      const campaign = {
        id: world.nextId('campaign'),
        title,
        body,
        status: 'sent' as const,
        audienceSize: DEMO_AUDIENCE.withConsent,
        opens: Math.round(DEMO_AUDIENCE.withConsent / 2),
        orders: 3,
        sentAt: world.now(),
      };
      world.campaigns = [campaign, ...world.campaigns];
      return campaign;
    },
  };
}
