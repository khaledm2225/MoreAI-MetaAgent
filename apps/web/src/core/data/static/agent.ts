import type { AgentEvent, AgentInput, ConfirmationRequest, SuggestedPiece, TraceKind } from '../../domain/agent';
import type { Id, Product } from '../../domain/catalog';
import { addressProblems, type Address } from '../../domain/order';
import type { AgentGateway, CartRepository, OrdersRepository, ProductSearch } from '../../domain/ports';
import type { ProductQuery } from '../../domain/search';
import type { PreferenceKind } from '../../domain/taste';
import type { LocalizedText } from '../../domain/text';
import { demoCategories, demoColors } from './demoCatalog';
import type { DemoWorld } from './demoWorld';
import { cartGrandTotal } from './repositories';
import { readShopperRequest, type ShopperRequest } from './requestReader';

const MODEL = 'muse-spark-1.3';
const SUGGESTIONS = 3;

export interface StaticAgentPorts {
  readonly world: DemoWorld;
  readonly search: ProductSearch;
  readonly cart: CartRepository;
  readonly orders: OrdersRepository;
}

function pounds(piasters: number): string {
  return new Intl.NumberFormat('en-EG').format(piasters / 100);
}

/** A scripted agent that runs the real journey through the real ports, with no model behind it. */
export function createStaticAgentGateway({ world, search, cart, orders }: StaticAgentPorts): AgentGateway {
  let pending: ConfirmationRequest | null = null;
  let address: Address | null = null;

  async function* trace(
    kind: TraceKind,
    name: string,
    summary: LocalizedText,
  ): AsyncGenerator<AgentEvent, void, void> {
    const id = world.nextId('trace');
    const started = world.now().getTime();
    yield { type: 'trace', step: { id, kind, name, summary, status: 'running', durationMs: null } };
    await world.wait();
    yield {
      type: 'trace',
      step: { id, kind, name, summary, status: 'done', durationMs: world.now().getTime() - started },
    };
  }

  function learn(kind: PreferenceKind, text: LocalizedText): AgentEvent | null {
    if (world.preferences.some((preference) => preference.text.en === text.en)) {
      return null;
    }
    const preference = { id: world.nextId('preference'), kind, text, source: 'agent' as const };
    world.preferences = [...world.preferences, preference];
    world.notify('preferences');
    return { type: 'preferenceLearned', preference };
  }

  function learnedFrom(request: ShopperRequest): readonly AgentEvent[] {
    const color = demoColors.find(({ code }) => code === request.colorCode);
    const events = [
      color === undefined ? null : learn('color', { en: `Likes ${color.name.en.toLowerCase()}`, ar: `بيحب ال${color.name.ar}` }),
      request.styleWord === undefined ? null : learn('style', { en: `Likes ${request.styleWord} pieces`, ar: `بيحب القطع ال${request.styleWord === 'oversized' ? 'واسعة' : 'مميزة'}` }),
      request.maxPricePiasters === undefined ? null : learn('budget', { en: `Budget around EGP ${pounds(request.maxPricePiasters)}`, ar: `الميزانية حوالي ${pounds(request.maxPricePiasters)} جنيه` }),
    ];
    return events.filter((event) => event !== null);
  }

  function toPiece(product: Product): SuggestedPiece | null {
    const merchant = world.merchantById(product.merchantId);
    if (merchant === undefined) {
      return null;
    }
    return {
      product,
      merchant,
      reason: {
        en: `Close to what you described, from ${merchant.name}.`,
        ar: `قريب من وصفك، من ${merchant.name}.`,
      },
    };
  }

  async function* handleText(text: string): AsyncGenerator<AgentEvent, void, void> {
    const request = readShopperRequest(text);
    yield* trace('model', MODEL, { en: 'Understanding your request', ar: 'بفهم طلبك' });
    yield* learnedFrom(request);

    if (request.wantsCheckout) {
      yield {
        type: 'needsAddress',
        id: world.nextId('address-request'),
        text: { en: 'Where should it go?', ar: 'نوصله فين؟' },
      };
      return;
    }

    const categoryId = demoCategories.find(({ slug }) => slug === request.categorySlug)?.id;
    const hasFilters = categoryId !== undefined || request.colorCode !== undefined || request.maxPricePiasters !== undefined;
    const query: ProductQuery = {
      ...(categoryId === undefined ? {} : { categoryId }),
      ...(request.colorCode === undefined ? {} : { colorCode: request.colorCode }),
      ...(request.maxPricePiasters === undefined ? {} : { maxPricePiasters: request.maxPricePiasters }),
      ...(request.styleWord === undefined && hasFilters ? {} : { text: request.styleWord ?? text }),
      limit: SUGGESTIONS,
    };
    yield* trace('tool', 'search_catalog', { en: 'Searching the brands', ar: 'بدور في البراندات' });
    const found = await search.search(query);
    const pieces = found.map(toPiece).filter((piece) => piece !== null);

    if (pieces.length === 0) {
      yield {
        type: 'nothingFits',
        id: world.nextId('nothing-fits'),
        text: {
          en: 'Nothing fits that right now. Try a bigger budget or another color?',
          ar: 'مفيش حاجة مناسبة دلوقتي. تجرب ميزانية أكبر أو لون تاني؟',
        },
      };
      return;
    }
    yield* trace('model', MODEL, { en: 'Choosing what suits you', ar: 'بختار اللي يناسبك' });
    yield {
      type: 'message',
      id: world.nextId('message'),
      text: { en: 'Here are the closest pieces. Pick a size to continue.', ar: 'دي أقرب القطع لطلبك. اختار المقاس عشان نكمل.' },
    };
    yield { type: 'suggestions', id: world.nextId('suggestions'), pieces };
  }

  async function* handleChoice(productId: Id, variantId: Id): AsyncGenerator<AgentEvent, void, void> {
    const product = world.productById(productId);
    if (product === undefined) {
      return;
    }
    pending = {
      id: world.nextId('confirmation'),
      kind: 'addToCart',
      question: {
        en: `Add the ${product.name.en} to your cart?`,
        ar: `أضيف ${product.name.ar} للأوردر؟`,
      },
      pieces: [{ productId, variantId, quantity: 1 }],
    };
    yield { type: 'confirm', request: pending };
  }

  async function* handleAddress(given: Address): AsyncGenerator<AgentEvent, void, void> {
    yield* trace('tool', 'validate_address', { en: 'Checking the address', ar: 'براجع العنوان' });
    if (addressProblems(given).length > 0) {
      yield {
        type: 'needsAddress',
        id: world.nextId('address-request'),
        text: { en: 'Some details are missing. Please check them.', ar: 'في بيانات ناقصة. راجعها لو سمحت.' },
      };
      return;
    }
    address = given;
    pending = {
      id: world.nextId('confirmation'),
      kind: 'placeOrder',
      question: { en: 'Place this order?', ar: 'أطلب الأوردر ده؟' },
      totalPiasters: cartGrandTotal(world),
    };
    yield { type: 'confirm', request: pending };
  }

  async function* placeOrder(): AsyncGenerator<AgentEvent, void, void> {
    if (address === null) {
      return;
    }
    yield* trace('tool', 'place_order', { en: 'Placing your order', ar: 'بطلب الأوردر' });
    const result = await orders.placeOrder(address);
    switch (result.kind) {
      case 'placed':
        yield { type: 'orderPlaced', orders: result.orders };
        return;
      case 'dailyLimit':
        yield { type: 'limitReached', text: { en: 'You reached the limit of orders for today. You can order again tomorrow.', ar: 'وصلت لحد الأوردرات النهارده. تقدر تطلب تاني بكرة.' } };
        return;
      case 'blocked':
        yield { type: 'limitReached', text: { en: 'A brand in your cart isn’t accepting your orders.', ar: 'براند في الأوردر مش بيقبل طلباتك.' } };
        return;
      case 'empty':
      case 'changed':
        yield {
          type: 'message',
          id: world.nextId('message'),
          text: { en: 'Your cart changed. Please check it first.', ar: 'الأوردر اتغير. راجعه الأول.' },
        };
        return;
    }
  }

  async function* handleConfirmation(requestId: Id, accepted: boolean): AsyncGenerator<AgentEvent, void, void> {
    const request = pending;
    if (request === null || request.id !== requestId) {
      return;
    }
    pending = null;
    if (!accepted) {
      yield {
        type: 'message',
        id: world.nextId('message'),
        text: { en: 'No problem, nothing changed.', ar: 'ماشي، محصلش أي تغيير.' },
      };
      return;
    }
    if (request.kind === 'placeOrder') {
      yield* placeOrder();
      return;
    }
    yield* trace('tool', 'add_to_cart', { en: 'Adding it to your cart', ar: 'بضيفها للأوردر' });
    for (const piece of request.pieces) {
      await cart.addPiece(piece.productId, piece.variantId, piece.quantity);
    }
    yield {
      type: 'needsAddress',
      id: world.nextId('address-request'),
      text: { en: 'Added. Where should we deliver it? Or ask me for another piece.', ar: 'اتضافت. نوصلها فين؟ أو اطلب مني قطعة تانية.' },
    };
  }

  return {
    send(input: AgentInput): AsyncIterable<AgentEvent> {
      switch (input.kind) {
        case 'text':
          return handleText(input.text);
        case 'chooseVariant':
          return handleChoice(input.productId, input.variantId);
        case 'address':
          return handleAddress(input.address);
        case 'confirmation':
          return handleConfirmation(input.requestId, input.accepted);
      }
    },
  };
}
