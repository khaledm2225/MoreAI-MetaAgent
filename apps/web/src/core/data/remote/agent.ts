import type { AgentEvent, AgentInput, ConfirmationRequest, SuggestedPiece, TraceKind } from '../../domain/agent';
import type { CartLine } from '../../domain/cart';
import type { Id, Merchant, Product, Size } from '../../domain/catalog';
import { addressProblems, type Address } from '../../domain/order';
import type { AgentGateway, CartRepository, OrdersRepository, PreferencesRepository, ProductSearch } from '../../domain/ports';
import { isBuyable, priceOfVariant } from '../../domain/search';
import type { PreferenceKind } from '../../domain/taste';
import type { LocalizedText } from '../../domain/text';
import type { PhotoInput } from '../../domain/vision';
import { ApiLimitError, type AgentInputItem, type ApiClient, type MetaResponse } from './api';
import { argumentsOf, functionCallsOf, outputTextOf, type FunctionCall } from './metaResponse';

const MODEL = 'muse-spark-1.3';
/** A loop that goes on longer than this has lost its way. */
const MAX_STEPS = 8;
const CANDIDATES = 6;
const PHOTOS = 4;
const PIASTERS = 100;
const MAX_QUANTITY = 10;
const PREFERENCE_KINDS: readonly string[] = ['color', 'size', 'style', 'budget'];

const same = (text: string): LocalizedText => ({ en: text, ar: text });
const LIMIT_TEXT: LocalizedText = { en: 'MoreAI reached its limit for now. Please try again later.', ar: 'MoreAI وصل للحد دلوقتي. جرب تاني بعدين.' };
const LOOP_TEXT: LocalizedText = { en: 'I got stuck on that. Could you say it another way?', ar: 'وقفت عند دي. ممكن تقولها بطريقة تانية؟' };

const TOOL_SUMMARIES: Readonly<Record<string, LocalizedText>> = {
  search_catalog: { en: 'Searching the brands by meaning', ar: 'بدور في البراندات بالمعنى' },
  show_pieces: { en: 'Showing what suits you', ar: 'بعرض اللي يناسبك' },
  remember_preference: { en: 'Saving what you like', ar: 'بحفظ اللي بتحبه' },
  add_to_cart: { en: 'Checking the piece before adding it', ar: 'براجع القطعة قبل ما أضيفها' },
  get_cart: { en: 'Reading your cart', ar: 'بقرا الأوردر' },
  update_cart_item: { en: 'Changing the quantity', ar: 'بغير الكمية' },
  remove_from_cart: { en: 'Removing it from your cart', ar: 'بشيلها من الأوردر' },
  request_address: { en: 'Asking where to deliver', ar: 'بسأل نوصله فين' },
  place_order: { en: 'Getting your order ready', ar: 'بجهز الأوردر' },
};

export interface RemoteAgentPorts {
  readonly api: Pick<ApiClient, 'agentStep'>;
  readonly search: ProductSearch;
  readonly cart: CartRepository;
  readonly orders: Pick<OrdersRepository, 'placeOrder'>;
  readonly preferences: Pick<PreferencesRepository, 'list' | 'add'>;
  readonly productById: (id: Id) => Product | undefined;
  readonly merchantById: (id: Id) => Merchant | undefined;
  readonly sizes: () => readonly Size[];
  readonly cartTotal: () => number;
  readonly locale: () => string;
  /** The public address of a product photo, when the model can reach it. */
  readonly publicPhotoUrl: (path: string) => string | null;
  readonly now: () => number;
  readonly newId: (prefix: string) => Id;
  /** Shrinks a photo the shopper attached, ready to send. */
  readonly toDataUrl: (previewUrl: string) => Promise<string>;
}

type Pending =
  | { readonly kind: 'confirm'; readonly callId: string; readonly request: ConfirmationRequest }
  | { readonly kind: 'address'; readonly callId: string };

const isQuantity = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY;

const toolOutput = (callId: string, value: unknown): AgentInputItem => ({ type: 'function_call_output', call_id: callId, output: JSON.stringify(value) });

/**
 * The agent loop, one backend request per model step. The model only ever proposes:
 * budgets, stock and totals are checked here in code, and anything that changes the
 * cart or places an order waits for the shopper. The address never reaches the model.
 */
export function createRemoteAgentGateway(ports: RemoteAgentPorts): AgentGateway {
  let previousResponseId: string | null = null;
  let pending: Pending | null = null;
  let address: Address | null = null;
  /** Answers to tool calls from the last turn, sent along with the shopper's next message. */
  let carried: AgentInputItem[] = [];

  async function* traced<T>(kind: TraceKind, name: string, summary: LocalizedText, work: () => Promise<T>): AsyncGenerator<AgentEvent, T, void> {
    const id = ports.newId('trace');
    const started = ports.now();
    yield { type: 'trace', step: { id, kind, name, summary, status: 'running', durationMs: null } };
    try {
      const result = await work();
      yield { type: 'trace', step: { id, kind, name, summary, status: 'done', durationMs: ports.now() - started } };
      return result;
    } catch (error) {
      yield { type: 'trace', step: { id, kind, name, summary, status: 'failed', durationMs: ports.now() - started } };
      throw error;
    }
  }

  async function* modelStep(input: readonly AgentInputItem[]): AsyncGenerator<AgentEvent, MetaResponse, void> {
    const preferences = await ports.preferences.list();
    const seesPhotos = input.some((item) => 'type' in item && item.type === 'message');
    const summary = seesPhotos ? { en: 'Looking at the photos', ar: 'ببص على الصور' } : { en: 'Thinking about your request', ar: 'بفكر في طلبك' };
    const response = yield* traced('model', MODEL, summary, () =>
      ports.api.agentStep({ input, previousResponseId, preferences: preferences.map(({ text }) => text.en), locale: ports.locale() }),
    );
    previousResponseId = response.id;
    return response;
  }

  function describe(product: Product): Record<string, unknown> {
    return {
      productId: product.id,
      name: product.name.en,
      brand: ports.merchantById(product.merchantId)?.name,
      priceEgp: product.pricePiasters / PIASTERS,
      looksLike: product.visualDescription,
    };
  }

  function cartSummary(lines: readonly CartLine[]): Record<string, unknown> {
    return {
      pieces: lines.map((line) => ({
        lineId: line.id,
        name: line.productName.en,
        brand: line.merchantName,
        size: line.sizeLabel,
        quantity: line.quantity,
        unitPriceEgp: line.unitPricePiasters / PIASTERS,
        soldOut: line.availability === 'soldOut',
      })),
      totalEgp: ports.cartTotal() / PIASTERS,
    };
  }

  /** What each tool does. `stop` ends the turn, and its answer goes out with the shopper's next message. */
  async function* runTool(call: FunctionCall, isOnlyCall: boolean): AsyncGenerator<AgentEvent, { output: AgentInputItem; photos?: AgentInputItem; stop?: boolean }, void> {
    const args = argumentsOf(call);
    const summary = TOOL_SUMMARIES[call.name] ?? same(call.name);
    const answer = (value: unknown, extra: { stop?: boolean; photos?: AgentInputItem } = {}) => ({ output: toolOutput(call.call_id, value), ...extra });

    switch (call.name) {
      case 'search_catalog': {
        const text = typeof args.text === 'string' ? args.text : '';
        const budget = typeof args.maxPriceEgp === 'number' && args.maxPriceEgp > 0 ? Math.round(args.maxPriceEgp * PIASTERS) : undefined;
        const found = yield* traced('tool', 'search_catalog', summary, () =>
          ports.search.search({
            text,
            limit: CANDIDATES,
            ...(typeof args.categorySlug === 'string' ? { categoryId: `category-${args.categorySlug}` } : {}),
            ...(typeof args.colorCode === 'string' ? { colorCode: args.colorCode } : {}),
            ...(budget === undefined ? {} : { maxPricePiasters: budget }),
          }),
        );
        if (found.length === 0 && !isOnlyCall) {
          // Part of a search across several colors, so the other results still count.
          return answer({ results: [] });
        }
        if (found.length === 0) {
          yield {
            type: 'nothingFits',
            id: ports.newId('nothing-fits'),
            text: { en: 'Nothing fits that right now. Try a bigger budget or another color?', ar: 'مفيش حاجة مناسبة دلوقتي. تجرب ميزانية أكبر أو لون تاني؟' },
          };
          return answer({ results: [], shopperWasTold: true }, { stop: true });
        }
        const photos = found.slice(0, PHOTOS).flatMap((product) => {
          const path = product.images[0]?.path;
          const url = path === undefined ? null : ports.publicPhotoUrl(path);
          return url === null ? [] : [{ product, url }];
        });
        return answer(
          { results: found.map(describe) },
          photos.length === 0
            ? {}
            : {
                photos: {
                  type: 'message',
                  role: 'user',
                  content: [
                    { type: 'input_text', text: `Photos of these candidates, in order: ${photos.map(({ product }) => product.id).join(', ')}. Look at them, then choose.` },
                    ...photos.map(({ url }) => ({ type: 'input_image' as const, image_url: url })),
                  ],
                },
              },
        );
      }
      case 'show_pieces': {
        const list = Array.isArray(args.pieces) ? (args.pieces as readonly Record<string, unknown>[]) : [];
        const pieces: SuggestedPiece[] = list.flatMap((piece) => {
          const product = typeof piece.productId === 'string' ? ports.productById(piece.productId) : undefined;
          const merchant = product === undefined ? undefined : ports.merchantById(product.merchantId);
          return product === undefined || merchant === undefined ? [] : [{ product, merchant, reason: same(typeof piece.reason === 'string' ? piece.reason : '') }];
        });
        if (pieces.length === 0) {
          return answer({ error: 'Those products don’t exist. Only use ids from search_catalog.' });
        }
        yield { type: 'suggestions', id: ports.newId('suggestions'), pieces };
        return answer({ shown: pieces.length, next: 'The shopper is choosing a size.' }, { stop: true });
      }
      case 'remember_preference': {
        const { kind, textEn, textAr } = args;
        if (typeof kind !== 'string' || !PREFERENCE_KINDS.includes(kind) || typeof textEn !== 'string' || typeof textAr !== 'string') {
          return answer({ error: 'Invalid preference.' });
        }
        const known = await ports.preferences.list();
        if (known.some(({ text }) => text.en.toLowerCase() === textEn.toLowerCase())) {
          return answer({ saved: true, alreadyKnown: true });
        }
        const preference = yield* traced('tool', 'remember_preference', summary, () => ports.preferences.add({ kind: kind as PreferenceKind, text: { en: textEn, ar: textAr } }));
        yield { type: 'preferenceLearned', preference };
        return answer({ saved: true });
      }
      case 'add_to_cart': {
        const product = typeof args.productId === 'string' ? ports.productById(args.productId) : undefined;
        const variant = product?.variants.find(({ id }) => id === args.variantId);
        if (product === undefined || variant === undefined || !isBuyable(variant)) {
          return answer({ error: 'That piece or size isn’t available.' });
        }
        const quantity = args.quantity === undefined ? 1 : args.quantity;
        if (!isQuantity(quantity) || quantity > variant.stockQuantity) {
          return answer({ error: `Only ${String(variant.stockQuantity)} left in that size.` });
        }
        const request: ConfirmationRequest = {
          id: ports.newId('confirmation'),
          kind: 'addToCart',
          question:
            quantity === 1
              ? { en: `Add the ${product.name.en} to your cart?`, ar: `أضيف ${product.name.ar} للأوردر؟` }
              : { en: `Add ${String(quantity)} of the ${product.name.en} to your cart?`, ar: `أضيف ${String(quantity)} من ${product.name.ar} للأوردر؟` },
          pieces: [{ productId: product.id, variantId: variant.id, quantity }],
        };
        pending = { kind: 'confirm', callId: call.call_id, request };
        yield { type: 'confirm', request };
        return answer(null, { stop: true });
      }
      case 'get_cart': {
        const lines = yield* traced('tool', 'get_cart', summary, () => ports.cart.listLines());
        return answer(cartSummary(lines));
      }
      case 'update_cart_item': {
        const line = (await ports.cart.listLines()).find(({ id }) => id === args.lineId);
        if (line === undefined) {
          return answer({ error: 'That piece isn’t in the cart. Call get_cart for the lineId.' });
        }
        const stock = ports.productById(line.productId)?.variants.find(({ id }) => id === line.variantId)?.stockQuantity ?? 0;
        if (!isQuantity(args.quantity) || args.quantity > stock) {
          return answer({ error: `The quantity must be a whole number from 1 to ${String(Math.min(stock, MAX_QUANTITY))}. To remove it, call remove_from_cart.` });
        }
        if (args.quantity === line.quantity) {
          return answer({ unchanged: true, quantity: line.quantity });
        }
        const request: ConfirmationRequest = {
          id: ports.newId('confirmation'),
          kind: 'changeCart',
          question: { en: `Change the ${line.productName.en}, size ${line.sizeLabel}, to ${String(args.quantity)}?`, ar: `أغير ${line.productName.ar}، مقاس ${line.sizeLabel}، لـ ${String(args.quantity)}؟` },
          lineId: line.id,
          quantity: args.quantity,
        };
        pending = { kind: 'confirm', callId: call.call_id, request };
        yield { type: 'confirm', request };
        return answer(null, { stop: true });
      }
      case 'remove_from_cart': {
        const line = (await ports.cart.listLines()).find(({ id }) => id === args.lineId);
        if (line === undefined) {
          return answer({ error: 'That piece isn’t in the cart. Call get_cart for the lineId.' });
        }
        const request: ConfirmationRequest = {
          id: ports.newId('confirmation'),
          kind: 'changeCart',
          question: { en: `Remove the ${line.productName.en}, size ${line.sizeLabel}, from your cart?`, ar: `أشيل ${line.productName.ar}، مقاس ${line.sizeLabel}، من الأوردر؟` },
          lineId: line.id,
          quantity: 0,
        };
        pending = { kind: 'confirm', callId: call.call_id, request };
        yield { type: 'confirm', request };
        return answer(null, { stop: true });
      }
      case 'request_address': {
        pending = { kind: 'address', callId: call.call_id };
        yield {
          type: 'needsAddress',
          id: ports.newId('address-request'),
          text: same(typeof args.message === 'string' && args.message !== '' ? args.message : 'Where should we deliver it?'),
        };
        return answer(null, { stop: true });
      }
      case 'place_order': {
        if (address === null) {
          return answer({ error: 'No address yet. Call request_address first.' });
        }
        if ((await ports.cart.listLines()).length === 0) {
          return answer({ error: 'The cart is empty.' });
        }
        const request: ConfirmationRequest = {
          id: ports.newId('confirmation'),
          kind: 'placeOrder',
          question: { en: 'Place this order?', ar: 'أطلب الأوردر ده؟' },
          totalPiasters: ports.cartTotal(),
        };
        pending = { kind: 'confirm', callId: call.call_id, request };
        yield { type: 'confirm', request };
        return answer(null, { stop: true });
      }
      default:
        return answer({ error: `Unknown tool ${call.name}` });
    }
  }

  async function* run(firstInput: readonly AgentInputItem[]): AsyncGenerator<AgentEvent, void, void> {
    let input = firstInput;
    try {
      for (let step = 0; step < MAX_STEPS; step += 1) {
        const response = yield* modelStep(input);
        const text = outputTextOf(response).replace(/\s+[—–]\s+/g, ', ');
        if (text !== '') {
          yield { type: 'message', id: ports.newId('message'), text: same(text) };
        }
        const calls = functionCallsOf(response);
        if (calls.length === 0) {
          return;
        }
        const outputs: AgentInputItem[] = [];
        const photos: AgentInputItem[] = [];
        let stop = false;
        for (const call of calls) {
          const result = yield* runTool(call, calls.length === 1);
          // A call waiting on the shopper is answered when they respond.
          if (pending === null || pending.callId !== call.call_id) {
            outputs.push(result.output);
          }
          if (result.photos !== undefined) {
            photos.push(result.photos);
          }
          stop ||= result.stop === true;
        }
        if (stop) {
          carried = outputs;
          return;
        }
        input = [...outputs, ...photos];
      }
      yield { type: 'message', id: ports.newId('message'), text: LOOP_TEXT };
    } catch (error) {
      if (error instanceof ApiLimitError) {
        yield { type: 'limitReached', text: LIMIT_TEXT };
        return;
      }
      throw error;
    }
  }

  function takeCarried(): AgentInputItem[] {
    const items = carried;
    carried = [];
    return items;
  }

  /** The shopper moved on from a question, so the model is told. */
  function abandonPending(): AgentInputItem[] {
    if (pending === null) {
      return [];
    }
    const item = toolOutput(pending.callId, { skipped: true, reason: 'The shopper sent a message instead of answering.' });
    pending = null;
    return [item];
  }

  async function* handleConfirmation(requestId: Id, accepted: boolean): AsyncGenerator<AgentEvent, void, void> {
    if (pending === null || pending.kind !== 'confirm' || pending.request.id !== requestId) {
      return;
    }
    const { callId, request } = pending;
    pending = null;
    if (!accepted) {
      yield* run([...takeCarried(), toolOutput(callId, { declined: true })]);
      return;
    }
    if (request.kind === 'addToCart') {
      yield* traced('tool', 'add_to_cart', { en: 'Adding it to your cart', ar: 'بضيفها للأوردر' }, async () => {
        for (const piece of request.pieces) {
          await ports.cart.addPiece(piece.productId, piece.variantId, piece.quantity);
        }
      });
      yield* run([...takeCarried(), toolOutput(callId, { added: true })]);
      return;
    }
    if (request.kind === 'changeCart') {
      const isRemoving = request.quantity === 0;
      const name = isRemoving ? 'remove_from_cart' : 'update_cart_item';
      yield* traced('tool', name, TOOL_SUMMARIES[name] ?? same(name), () =>
        isRemoving ? ports.cart.removeLine(request.lineId) : ports.cart.setQuantity(request.lineId, request.quantity),
      );
      yield* run([...takeCarried(), toolOutput(callId, { done: true, cart: cartSummary(await ports.cart.listLines()) })]);
      return;
    }
    if (address === null) {
      return;
    }
    const given = address;
    const result = yield* traced('tool', 'place_order', { en: 'Placing your order', ar: 'بطلب الأوردر' }, () => ports.orders.placeOrder(given));
    switch (result.kind) {
      case 'placed':
        carried = [...takeCarried(), toolOutput(callId, { placed: true, orders: result.orders.length })];
        yield { type: 'orderPlaced', orders: result.orders };
        return;
      case 'dailyLimit':
        carried = [...takeCarried(), toolOutput(callId, { placed: false, reason: 'daily limit' })];
        yield { type: 'limitReached', text: { en: 'You reached the limit of orders for today. You can order again tomorrow.', ar: 'وصلت لحد الأوردرات النهارده. تقدر تطلب تاني بكرة.' } };
        return;
      case 'blocked':
        carried = [...takeCarried(), toolOutput(callId, { placed: false, reason: 'a brand refused' })];
        yield { type: 'limitReached', text: { en: 'A brand in your cart isn’t accepting your orders.', ar: 'براند في الأوردر مش بيقبل أوردراتك.' } };
        return;
      case 'empty':
      case 'changed':
        yield* run([...takeCarried(), toolOutput(callId, { placed: false, reason: 'The cart changed. Ask the shopper to check it.' })]);
        return;
    }
  }

  async function* handleAddress(given: Address): AsyncGenerator<AgentEvent, void, void> {
    if (addressProblems(given).length > 0) {
      yield { type: 'needsAddress', id: ports.newId('address-request'), text: { en: 'Some details are missing. Please check them.', ar: 'في بيانات ناقصة. راجعها لو سمحت.' } };
      return;
    }
    address = given;
    if (pending?.kind === 'address') {
      const { callId } = pending;
      pending = null;
      yield* run([...takeCarried(), toolOutput(callId, { saved: true })]);
      return;
    }
    yield* run([...takeCarried(), { role: 'user', content: 'I saved my delivery address.' }]);
  }

  async function* handleText(text: string, photo: PhotoInput | undefined): AsyncGenerator<AgentEvent, void, void> {
    const earlier = [...takeCarried(), ...abandonPending()];
    if (photo === undefined) {
      yield* run([...earlier, { role: 'user', content: text }]);
      return;
    }
    const image = await ports.toDataUrl(photo.previewUrl);
    yield* run([...earlier, { type: 'message', role: 'user', content: [{ type: 'input_text', text }, { type: 'input_image', image_url: image }] }]);
  }

  function chosenPieceMessage(productId: Id, variantId: Id): string {
    const product = ports.productById(productId);
    const variant = product?.variants.find(({ id }) => id === variantId);
    const size = ports.sizes().find(({ id }) => id === variant?.sizeId)?.label ?? '';
    const price = product === undefined || variant === undefined ? 0 : priceOfVariant(product, variant) / PIASTERS;
    return `I choose size ${size} of the ${product?.name.en ?? ''} at EGP ${String(price)}. productId=${productId} variantId=${variantId}`;
  }

  return {
    send(input: AgentInput): AsyncIterable<AgentEvent> {
      switch (input.kind) {
        case 'text':
          return handleText(input.text, input.photo);
        case 'chooseVariant':
          return run([...takeCarried(), ...abandonPending(), { role: 'user', content: chosenPieceMessage(input.productId, input.variantId) }]);
        case 'address':
          return handleAddress(input.address);
        case 'confirmation':
          return handleConfirmation(input.requestId, input.accepted);
      }
    },
  };
}
