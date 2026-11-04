import { describe, expect, it, vi } from 'vitest';
import type { AgentEvent, AgentInput } from '../../domain/agent';
import type { Address } from '../../domain/order';
import { createStaticPorts } from '../static';
import { DemoWorld } from '../static/demoWorld';
import { demoSizes } from '../static/demoCatalog';
import { cartGrandTotal } from '../static/repositories';
import { createRemoteAgentGateway } from './agent';
import type { AgentStepRequest, MetaResponse } from './api';
import { ApiLimitError } from './api';

const address: Address = { recipientName: 'Khaled', mobile: '01012345678', area: 'Maadi', street: 'Road 9', building: '12', floor: '', apartment: '', landmark: '', notes: '' };
const say = (text: string): MetaResponse => ({ id: 'r', output: [{ type: 'message', content: [{ type: 'output_text', text }] }] });
const call = (name: string, args: unknown, id = name): MetaResponse => ({ id: `r-${id}`, output: [{ type: 'function_call', name, arguments: JSON.stringify(args), call_id: id }] });

function setup(script: readonly MetaResponse[]) {
  const world = new DemoWorld({ latencyMs: 0, clock: () => new Date('2026-11-04T20:00:00+02:00') });
  return setupWith({ world, ports: createStaticPorts({ latencyMs: 0, clock: () => new Date('2026-11-04T20:00:00+02:00') }, world) }, script);
}

function setupWith({ world, ports }: { readonly world: DemoWorld; readonly ports: ReturnType<typeof createStaticPorts> }, script: readonly MetaResponse[]) {
  const steps: AgentStepRequest[] = [];
  let index = 0;
  const agentStep = vi.fn((request: AgentStepRequest) => {
    steps.push(request);
    const next = script[index];
    index += 1;
    return next === undefined ? Promise.reject(new Error('The script ended')) : Promise.resolve(next);
  });
  const gateway = createRemoteAgentGateway({
    api: { agentStep },
    search: ports.productSearch,
    cart: ports.cart,
    orders: ports.orders,
    preferences: ports.preferences,
    productById: (id) => world.productById(id),
    merchantById: (id) => world.merchantById(id),
    sizes: () => demoSizes,
    cartTotal: () => cartGrandTotal(world),
    locale: () => 'en',
    publicPhotoUrl: (path) => `https://shop.test${path}`,
    now: () => 0,
    newId: (prefix) => world.nextId(prefix),
    toDataUrl: () => Promise.resolve('data:image/jpeg;base64,AA'),
  });
  const send = async (input: AgentInput) => {
    const events: AgentEvent[] = [];
    for await (const event of gateway.send(input)) {
      events.push(event);
    }
    return events;
  };
  return { send, steps, world, ports };
}

const of = <T extends AgentEvent['type']>(events: readonly AgentEvent[], type: T) => events.filter((event): event is Extract<AgentEvent, { type: T }> => event.type === type);

describe('the real agent loop', () => {
  it('enforces the budget in code, so a 1,000 EGP jacket never reaches the model for a 500 EGP budget', async () => {
    const { send, steps } = setup([call('search_catalog', { text: 'black jacket', colorCode: 'black', categorySlug: 'jackets', maxPriceEgp: 500 }), say('Here you go')]);
    await send({ kind: 'text', text: 'black jacket under 500' });
    const output = steps[1]?.input.find((item) => 'type' in item && item.type === 'function_call_output');
    const results = (JSON.parse((output as { output: string }).output) as { results: { priceEgp: number }[] }).results;
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(({ priceEgp }) => priceEgp <= 500)).toBe(true);
  });

  it('shows the candidates’ photos to the model, in a user message', async () => {
    const { send, steps } = setup([call('search_catalog', { text: 'black jacket' }), say('ok')]);
    await send({ kind: 'text', text: 'black jacket' });
    const message = steps[1]?.input.find((item) => 'type' in item && item.type === 'message');
    expect(JSON.stringify(message)).toContain('https://shop.test/products/');
  });

  it('tells the shopper when nothing fits, and keeps the conversation going later', async () => {
    const { send, steps } = setup([call('search_catalog', { text: 'jacket', maxPriceEgp: 1 }), say('Sure')]);
    const events = await send({ kind: 'text', text: 'a jacket for 1 EGP' });
    expect(of(events, 'nothingFits')).toHaveLength(1);
    expect(steps).toHaveLength(1);
    await send({ kind: 'text', text: 'ok' });
    expect(JSON.stringify(steps[1]?.input)).toContain('function_call_output');
    expect(steps[1]?.previousResponseId).toBe('r-search_catalog');
  });

  it('refuses a product the model made up', async () => {
    const { send } = setup([call('show_pieces', { pieces: [{ productId: 'fake', reason: 'x' }] }), say('Sorry')]);
    const events = await send({ kind: 'text', text: 'hi' });
    expect(of(events, 'suggestions')).toHaveLength(0);
  });

  it('adds nothing to the cart until the shopper confirms, and nothing when they say no', async () => {
    const { send, world } = setup([call('add_to_cart', { productId: 'product-1-2', variantId: 'bad' }), say('That size is gone')]);
    await send({ kind: 'text', text: 'add it' });
    expect(world.cart).toHaveLength(0);

    const product = world.products.find(({ id }) => id === 'product-1-2');
    const variant = product?.variants.find(({ stockQuantity }) => stockQuantity > 0);
    const second = setup([call('add_to_cart', { productId: 'product-1-2', variantId: variant?.id }), say('No problem')]);
    const events = await second.send({ kind: 'chooseVariant', productId: 'product-1-2', variantId: variant?.id ?? '' });
    const [confirm] = of(events, 'confirm');
    expect(second.world.cart).toHaveLength(0);
    await second.send({ kind: 'confirmation', requestId: confirm?.request.id ?? '', accepted: false });
    expect(second.world.cart).toHaveLength(0);
    expect(JSON.stringify(second.steps[1]?.input)).toContain('declined');
  });

  it('goes all the way to a placed order, and never shows the address to the model', async () => {
    const world = new DemoWorld({ latencyMs: 0, clock: () => new Date() });
    const variantId = world.products.find(({ id }) => id === 'product-1-2')?.variants.find(({ stockQuantity }) => stockQuantity > 0)?.id ?? '';
    const { send, steps, world: live } = setup([
      call('add_to_cart', { productId: 'product-1-2', variantId }),
      call('request_address', { message: 'Added. Where to?' }),
      call('place_order', {}),
    ]);
    const first = await send({ kind: 'chooseVariant', productId: 'product-1-2', variantId });
    const added = await send({ kind: 'confirmation', requestId: of(first, 'confirm')[0]?.request.id ?? '', accepted: true });
    expect(live.cart).toHaveLength(1);
    expect(of(added, 'needsAddress')[0]?.text.en).toBe('Added. Where to?');
    const confirmOrder = await send({ kind: 'address', address });
    const request = of(confirmOrder, 'confirm')[0]?.request;
    expect(request?.kind === 'placeOrder' && request.totalPiasters).toBeGreaterThan(0);
    expect(live.orders).toHaveLength(0);
    const placed = await send({ kind: 'confirmation', requestId: request?.id ?? '', accepted: true });
    expect(of(placed, 'orderPlaced')[0]?.orders).toHaveLength(1);
    expect(JSON.stringify(steps)).not.toContain('01012345678');
    expect(JSON.stringify(steps)).not.toContain('Road 9');
  });

  describe('changing the cart', () => {
    it('gives the model each line’s id', async () => {
      const context = setup([]);
      const variant = context.world.products.find(({ id }) => id === 'product-1-2')?.variants.find(({ stockQuantity }) => stockQuantity >= 1);
      await context.ports.cart.addPiece('product-1-2', variant?.id ?? '', 1);
      const { send, steps } = setupWith(context, [call('get_cart', {}), say('You have one piece')]);
      await send({ kind: 'text', text: 'what’s in my cart?' });
      expect(JSON.stringify(steps[1]?.input)).toContain('lineId');
    });

    it('asks first, then sets the new quantity', async () => {
      const context = setup([]);
      const variant = context.world.products.find(({ id }) => id === 'product-1-2')?.variants.find(({ stockQuantity }) => stockQuantity >= 2);
      await context.ports.cart.addPiece('product-1-2', variant?.id ?? '', 1);
      const lineId = context.world.cart[0]?.id ?? '';
      const { send, world, ports } = setupWith(context, [call('update_cart_item', { lineId, quantity: 2 }), say('Done')]);
      const events = await send({ kind: 'text', text: 'make it 2' });
      expect(of(events, 'confirm')[0]?.request.kind).toBe('changeCart');
      expect(world.cart[0]?.quantity).toBe(1);
      await send({ kind: 'confirmation', requestId: of(events, 'confirm')[0]?.request.id ?? '', accepted: true });
      expect((await ports.cart.listLines())[0]?.quantity).toBe(2);
    });

    it('asks first, then removes the piece, and does nothing when the shopper says no', async () => {
      const context = setup([]);
      const variant = context.world.products.find(({ id }) => id === 'product-1-2')?.variants.find(({ stockQuantity }) => stockQuantity >= 1);
      await context.ports.cart.addPiece('product-1-2', variant?.id ?? '', 1);
      const lineId = context.world.cart[0]?.id ?? '';
      const { send, world } = setupWith(context, [call('remove_from_cart', { lineId }, 'r1'), say('Kept'), call('remove_from_cart', { lineId }, 'r2'), say('Removed')]);
      const first = await send({ kind: 'text', text: 'remove it' });
      await send({ kind: 'confirmation', requestId: of(first, 'confirm')[0]?.request.id ?? '', accepted: false });
      expect(world.cart).toHaveLength(1);
      const second = await send({ kind: 'text', text: 'actually remove it' });
      await send({ kind: 'confirmation', requestId: of(second, 'confirm')[0]?.request.id ?? '', accepted: true });
      expect(world.cart).toHaveLength(0);
    });

    it('refuses a made up line, more than the stock, and a bad quantity', async () => {
      const context = setup([]);
      const variant = context.world.products.find(({ id }) => id === 'product-1-2')?.variants.find(({ stockQuantity }) => stockQuantity >= 1);
      await context.ports.cart.addPiece('product-1-2', variant?.id ?? '', 1);
      const lineId = context.world.cart[0]?.id ?? '';
      const { send, world } = setupWith(context, [
        call('remove_from_cart', { lineId: 'fake' }, 'a'),
        call('update_cart_item', { lineId, quantity: 9_999 }, 'b'),
        call('update_cart_item', { lineId, quantity: 1.5 }, 'c'),
        say('Sorry'),
      ]);
      const events = await send({ kind: 'text', text: 'change it' });
      expect(of(events, 'confirm')).toHaveLength(0);
      expect(world.cart[0]?.quantity).toBe(1);
    });

    it('can add more than one, within the stock', async () => {
      const context = setup([]);
      const variant = context.world.products.find(({ id }) => id === 'product-1-2')?.variants.find(({ stockQuantity }) => stockQuantity >= 2);
      const { send, world } = setupWith(context, [call('add_to_cart', { productId: 'product-1-2', variantId: variant?.id, quantity: 2 }), say('Added')]);
      const events = await send({ kind: 'text', text: 'two please' });
      await send({ kind: 'confirmation', requestId: of(events, 'confirm')[0]?.request.id ?? '', accepted: true });
      expect(world.cart[0]?.quantity).toBe(2);
    });
  });

  describe('a photo from the shopper', () => {
    it('reaches the model with the words, so it can match the outfit', async () => {
      const { send, steps } = setup([say('Burgundy goes well with that')]);
      await send({ kind: 'text', text: 'A jacket that goes with this', photo: { name: 'me.jpg', type: 'image/jpeg', sizeBytes: 10, previewUrl: 'blob:me' } });
      const message = JSON.stringify(steps[0]?.input);
      expect(message).toContain('A jacket that goes with this');
      expect(message).toContain('data:image/jpeg;base64,AA');
    });

    it('can search several colors at once, even when one has nothing', async () => {
      const { send, steps } = setup([
        { id: 'r1', output: [
          { type: 'function_call', name: 'search_catalog', arguments: JSON.stringify({ text: 'jacket', categorySlug: 'jackets', colorCode: 'olive' }), call_id: 'a' },
          { type: 'function_call', name: 'search_catalog', arguments: JSON.stringify({ text: 'jacket', categorySlug: 'jackets', colorCode: 'navy' }), call_id: 'b' },
        ] },
        say('Navy would look great'),
      ]);
      const events = await send({ kind: 'text', text: 'What color jacket goes with this?' });
      expect(of(events, 'nothingFits')).toHaveLength(0);
      expect(steps).toHaveLength(2);
      const outputs = steps[1]?.input.filter((item) => 'type' in item && item.type === 'function_call_output') ?? [];
      expect(outputs).toHaveLength(2);
    });
  });

  it('keeps the model’s dashes out of what the shopper reads', async () => {
    const { send } = setup([say('Black goes great — let me look')]);
    const events = await send({ kind: 'text', text: 'hi' });
    expect(of(events, 'message')[0]?.text.en).toBe('Black goes great, let me look');
  });

  it('won’t place an order without an address', async () => {
    const { send, world } = setup([call('place_order', {}), say('Where to?')]);
    const events = await send({ kind: 'text', text: 'order it' });
    expect(of(events, 'confirm')).toHaveLength(0);
    expect(world.orders).toHaveLength(0);
  });

  it('saves a taste once, and shows it', async () => {
    const taste = { kind: 'color', textEn: 'Likes black', textAr: 'بيحب الأسود' };
    const { send, world } = setup([call('remember_preference', taste, 'a'), say('Noted'), call('remember_preference', taste, 'b'), say('Noted')]);
    const events = await send({ kind: 'text', text: 'I like black' });
    expect(of(events, 'preferenceLearned')).toHaveLength(1);
    await send({ kind: 'text', text: 'I really like black' });
    expect(world.preferences).toHaveLength(1);
  });

  it('survives broken arguments from the model', async () => {
    const { send } = setup([{ id: 'r', output: [{ type: 'function_call', name: 'search_catalog', arguments: 'not json', call_id: 'c' }] }, say('ok')]);
    await expect(send({ kind: 'text', text: 'hi' })).resolves.toBeDefined();
  });

  it('stops a loop that never ends', async () => {
    const { send, steps } = setup(Array.from({ length: 20 }, (_, index) => call('get_cart', {}, `c${String(index)}`)));
    const events = await send({ kind: 'text', text: 'hi' });
    expect(steps).toHaveLength(8);
    expect(of(events, 'message').at(-1)?.text.en).toContain('stuck');
  });

  it('says when today’s limit is reached', async () => {
    const world = new DemoWorld({ latencyMs: 0, clock: () => new Date() });
    const ports = createStaticPorts({ latencyMs: 0, clock: () => new Date() }, world);
    const gateway = createRemoteAgentGateway({
      api: { agentStep: () => Promise.reject(new ApiLimitError('limit')) },
      search: ports.productSearch,
      cart: ports.cart,
      orders: ports.orders,
      preferences: ports.preferences,
      productById: () => undefined,
      merchantById: () => undefined,
      sizes: () => [],
      cartTotal: () => 0,
      locale: () => 'en',
      publicPhotoUrl: () => null,
      now: () => 0,
      newId: (prefix) => prefix,
      toDataUrl: () => Promise.resolve(''),
    });
    const events: AgentEvent[] = [];
    for await (const event of gateway.send({ kind: 'text', text: 'hi' })) {
      events.push(event);
    }
    expect(of(events, 'limitReached')).toHaveLength(1);
  });
});
