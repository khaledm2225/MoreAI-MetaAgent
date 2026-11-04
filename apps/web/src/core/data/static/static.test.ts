import { describe, expect, it } from 'vitest';
import type { AgentEvent, AgentInput, ConfirmationRequest, SuggestedPiece } from '../../domain/agent';
import type { Address } from '../../domain/order';
import { buildDemoProducts, demoMerchants, PRODUCTS_PER_MERCHANT } from './demoCatalog';
import { createStaticPorts } from './index';

const address: Address = {
  recipientName: 'Khaled',
  mobile: '01012345678',
  area: 'Maadi',
  street: 'Road 9',
  building: '12',
  floor: '',
  apartment: '',
  landmark: '',
  notes: '',
};

function ports(now = new Date('2026-11-04T20:00:00+02:00')) {
  return createStaticPorts({ latencyMs: 0, clock: () => now });
}

async function collect(stream: AsyncIterable<AgentEvent>): Promise<readonly AgentEvent[]> {
  const events: AgentEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

type App = ReturnType<typeof ports>;
const send = (app: App, input: AgentInput) => collect(app.agent.send(input));

function suggestedIn(events: readonly AgentEvent[]): readonly SuggestedPiece[] {
  return events.flatMap((event) => (event.type === 'suggestions' ? event.pieces : []));
}

function confirmationIn(events: readonly AgentEvent[]): ConfirmationRequest {
  const event = events.find((item) => item.type === 'confirm');
  if (event?.type !== 'confirm') {
    throw new Error('Expected a confirmation request.');
  }
  return event.request;
}

async function buyOnePiece(app: App, text = 'black jacket under 500'): Promise<void> {
  const piece = suggestedIn(await send(app, { kind: 'text', text }))[0];
  const variant = piece?.product.variants.find((item) => item.stockQuantity > 0);
  if (piece === undefined || variant === undefined) {
    throw new Error('Expected a piece to buy.');
  }
  const addRequest = confirmationIn(await send(app, { kind: 'chooseVariant', productId: piece.product.id, variantId: variant.id }));
  await send(app, { kind: 'confirmation', requestId: addRequest.id, accepted: true });
}

describe('the demo catalog', () => {
  const products = buildDemoProducts();

  it('has 20 made up brands with at least 10 products each', () => {
    expect(demoMerchants).toHaveLength(20);
    for (const merchant of demoMerchants) {
      expect(products.filter(({ merchantId }) => merchantId === merchant.id).length).toBeGreaterThanOrEqual(PRODUCTS_PER_MERCHANT);
    }
  });

  it('has unique ids and whole piaster prices', () => {
    expect(new Set(products.map(({ id }) => id)).size).toBe(products.length);
    for (const product of products) {
      expect(Number.isSafeInteger(product.pricePiasters)).toBe(true);
      expect(product.pricePiasters).toBeGreaterThan(0);
    }
  });

  it('has words in both languages for every product', () => {
    for (const product of products) {
      expect(product.name.en).not.toBe('');
      expect(product.name.ar).toMatch(/[؀-ۿ]/);
      expect(product.images[0]?.alt.ar).toMatch(/[؀-ۿ]/);
    }
  });

  it('includes a black jacket at 1,000 EGP and several under 500 EGP', () => {
    const blackJackets = products.filter(({ name }) => name.en.toLowerCase().includes('black') && name.en.includes('jacket'));
    expect(blackJackets.some(({ pricePiasters }) => pricePiasters === 100_000)).toBe(true);
    expect(blackJackets.filter(({ pricePiasters }) => pricePiasters <= 50_000).length).toBeGreaterThanOrEqual(3);
  });
});

describe('the scripted agent', () => {
  it('never suggests the 1,000 EGP black jacket for a 500 EGP budget, in either language', async () => {
    for (const text of ['black jacket under 500', 'جاكيت أسود في حدود 500 جنيه']) {
      const pieces = suggestedIn(await send(ports(), { kind: 'text', text }));
      expect(pieces.length).toBeGreaterThan(0);
      for (const { product } of pieces) {
        expect(product.pricePiasters).toBeLessThanOrEqual(50_000);
      }
    }
  });

  it('shows the 1,000 EGP jacket when there is no budget', async () => {
    const app = ports();
    const found = await app.productSearch.search({ text: 'black jacket' });
    expect(found.some(({ pricePiasters }) => pricePiasters === 100_000)).toBe(true);
  });

  it('says so when nothing fits', async () => {
    const events = await send(ports(), { kind: 'text', text: 'black jacket under 100' });
    expect(events.some(({ type }) => type === 'nothingFits')).toBe(true);
    expect(suggestedIn(events)).toEqual([]);
  });

  it('shows every step it takes, by its real name', async () => {
    const events = await send(ports(), { kind: 'text', text: 'black jacket' });
    const names = events.flatMap((event) => (event.type === 'trace' ? [event.step.name] : []));
    expect(names).toContain('muse-spark-1.3');
    expect(names).toContain('search_catalog');
    const statuses = events.flatMap((event) => (event.type === 'trace' ? [event.step.status] : []));
    expect(statuses).toContain('running');
    expect(statuses).toContain('done');
  });

  it('learns preferences, and tells the account', async () => {
    const app = ports();
    const events = await send(app, { kind: 'text', text: 'black oversized jacket under 500' });
    expect(events.filter(({ type }) => type === 'preferenceLearned').length).toBeGreaterThanOrEqual(2);
    expect((await app.preferences.list()).map(({ source }) => source)).toContain('agent');
  });

  it('adds nothing to the cart until the shopper confirms', async () => {
    const app = ports();
    const piece = suggestedIn(await send(app, { kind: 'text', text: 'black jacket' }))[0];
    const variant = piece?.product.variants.find((item) => item.stockQuantity > 0);
    if (piece === undefined || variant === undefined) {
      throw new Error('Expected a piece.');
    }
    const request = confirmationIn(await send(app, { kind: 'chooseVariant', productId: piece.product.id, variantId: variant.id }));
    expect(await app.cart.listLines()).toEqual([]);
    await send(app, { kind: 'confirmation', requestId: request.id, accepted: false });
    expect(await app.cart.listLines()).toEqual([]);
  });

  it('runs the whole journey, and places nothing until the shopper confirms', async () => {
    const app = ports();
    await buyOnePiece(app);
    expect(await app.cart.listLines()).toHaveLength(1);

    const orderRequest = confirmationIn(await send(app, { kind: 'address', address }));
    expect(orderRequest.kind).toBe('placeOrder');
    expect(await app.orders.listOrders()).toEqual([]);

    const events = await send(app, { kind: 'confirmation', requestId: orderRequest.id, accepted: true });
    expect(events.some(({ type }) => type === 'orderPlaced')).toBe(true);
    expect(await app.orders.listOrders()).toHaveLength(1);
    expect(await app.cart.listLines()).toEqual([]);
  });

  it('asks again for a bad address', async () => {
    const app = ports();
    await buyOnePiece(app);
    const events = await send(app, { kind: 'address', address: { ...address, mobile: '123' } });
    expect(events.some(({ type }) => type === 'needsAddress')).toBe(true);
    expect(events.some(({ type }) => type === 'confirm')).toBe(false);
  });

  it('ignores a confirmation it never asked for', async () => {
    const app = ports();
    expect(await send(app, { kind: 'confirmation', requestId: 'made-up', accepted: true })).toEqual([]);
    expect(await app.orders.listOrders()).toEqual([]);
  });
});

describe('orders', () => {
  it('makes one order per brand from one cart, with exact totals', async () => {
    const app = ports();
    const [first, second] = await Promise.all([app.catalog.listProducts('merchant-2'), app.catalog.listProducts('merchant-3')]);
    for (const product of [first[0], second[0]]) {
      const variant = product?.variants.find((item) => item.stockQuantity > 0);
      if (product === undefined || variant === undefined) {
        throw new Error('Expected a product.');
      }
      await app.cart.addPiece(product.id, variant.id, 2);
    }
    const result = await app.orders.placeOrder(address);
    if (result.kind !== 'placed') {
      throw new Error(`Expected placed, got ${result.kind}`);
    }
    expect(result.orders).toHaveLength(2);
    for (const order of result.orders) {
      expect(order.totalPiasters).toBe(order.subtotalPiasters + order.deliveryFeePiasters);
    }
  });

  it('refuses a second order from the same brand on the same day', async () => {
    const app = ports();
    const product = (await app.catalog.listProducts('merchant-2'))[0];
    const variant = product?.variants.find((item) => item.stockQuantity > 2);
    if (product === undefined || variant === undefined) {
      throw new Error('Expected a product.');
    }
    await app.cart.addPiece(product.id, variant.id, 1);
    await app.orders.placeOrder(address);
    await app.cart.addPiece(product.id, variant.id, 1);
    expect(await app.orders.placeOrder(address)).toMatchObject({ kind: 'dailyLimit', reason: 'BRAND_DAILY_LIMIT' });
  });

  it('has nothing to place from an empty cart', async () => {
    expect(await ports().orders.placeOrder(address)).toEqual({ kind: 'empty' });
  });
});

describe('the merchant side', () => {
  const form = { name: 'Test Brand', bio: 'Warm pieces', imageUrl: null };

  it('puts a new brand and its published product into the catalog and search', async () => {
    const app = ports();
    const merchant = await app.merchantProfile.join(form);
    expect((await app.catalog.listMerchants()).map(({ id }) => id)).toContain(merchant.id);
    const product = await app.merchantProducts.publish({
      name: { en: 'Silver unicorn jacket', ar: 'جاكيت فضي' },
      description: { en: 'Shiny', ar: 'لامع' },
      visualDescription: 'silver unicorn jacket',
      categoryId: 'category-jackets',
      colorCodes: ['black'],
      sizeLabels: ['M'],
      pricePiasters: 70_000,
      stockPerVariant: 3,
      imageUrls: [],
    });
    expect((await app.productSearch.search({ text: 'unicorn' })).map(({ id }) => id)).toEqual([product.id]);
  });

  it('keeps a draft out of search', async () => {
    const app = ports();
    await app.merchantProfile.join(form);
    await app.merchantProducts.saveDraft({
      name: { en: 'Silver unicorn jacket', ar: 'جاكيت فضي' },
      description: { en: 'Shiny', ar: 'لامع' },
      visualDescription: 'silver unicorn jacket',
      categoryId: 'category-jackets',
      colorCodes: ['black'],
      sizeLabels: ['M'],
      pricePiasters: 70_000,
      stockPerVariant: 3,
      imageUrls: [],
    });
    expect(await app.productSearch.search({ text: 'unicorn' })).toEqual([]);
  });

  it('shows a client the status a brand sets, and tells subscribers', async () => {
    const app = ports();
    const merchant = await app.merchantProfile.join(form);
    const product = await app.merchantProducts.publish({
      name: { en: 'Silver unicorn jacket', ar: 'جاكيت فضي' },
      description: { en: 'Shiny', ar: 'لامع' },
      visualDescription: 'silver unicorn jacket',
      categoryId: 'category-jackets',
      colorCodes: ['black'],
      sizeLabels: ['M'],
      pricePiasters: 70_000,
      stockPerVariant: 3,
      imageUrls: [],
    });
    const variant = product.variants[0];
    if (variant === undefined) {
      throw new Error('Expected a variant.');
    }
    await app.cart.addPiece(product.id, variant.id, 1);
    const result = await app.orders.placeOrder(address);
    if (result.kind !== 'placed') {
      throw new Error('Expected an order.');
    }
    const order = result.orders[0];
    if (order === undefined) {
      throw new Error('Expected an order.');
    }
    expect(order.merchantId).toBe(merchant.id);
    let changes = 0;
    const stop = app.orders.subscribe(() => {
      changes += 1;
    });
    await app.merchantOrders.moveOrder(order.id, 'ACCEPTED');
    stop();
    expect(changes).toBe(1);
    expect((await app.orders.getOrder(order.id))?.status).toBe('ACCEPTED');
  });

  it('refuses a move an order can’t make', async () => {
    const app = ports();
    await app.merchantProfile.join(form);
    await expect(app.merchantOrders.moveOrder('missing', 'ACCEPTED')).rejects.toThrow();
  });
});

describe('new records', () => {
  it('never take the id of a demo brand', async () => {
    const ports = createStaticPorts({ latencyMs: 0, clock: () => new Date('2026-11-04T20:00:00+02:00') });
    const joined = await ports.merchantProfile.join({ name: 'Night Studio', bio: 'Calm', imageUrl: null });
    expect(await ports.catalog.getMerchant(joined.id)).toMatchObject({ name: 'Night Studio' });
    const merchants = await ports.catalog.listMerchants();
    expect(new Set(merchants.map(({ id }) => id)).size).toBe(merchants.length);
  });
});
