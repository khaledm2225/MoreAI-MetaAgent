import type { SuggestedPiece, TraceStep } from '../../core/domain/agent';
import type { Merchant, Product } from '../../core/domain/catalog';
import type { ScreenPreviews } from '../../core/presentation/preview';
import type { ChatItem, ChatState } from './presentation/chatState';
import { ChatView } from './presentation/ChatView';

const noop = () => {};
const merchant: Merchant = { id: 'm', slug: 'b', name: 'Sawa Studio', bio: { en: 'Bio', ar: 'نبذة' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 5_000 };
const product: Product = {
  id: 'p',
  merchantId: 'm',
  categoryId: 'c',
  name: { en: 'Black oversized jacket', ar: 'جاكيت أسود واسع' },
  description: { en: 'A jacket', ar: 'جاكيت' },
  visualDescription: 'black jacket',
  gender: 'UNISEX',
  status: 'ACTIVE',
  pricePiasters: 45_000,
  images: [],
  variants: ['s', 'm', 'l'].map((size, index) => ({ id: size, productId: 'p', colorId: 'c', sizeId: size, pricePiasters: null, stockQuantity: index, isAvailable: true })),
};
const piece: SuggestedPiece = { product, merchant, reason: { en: 'Close to what you described.', ar: 'قريب من وصفك.' } };
const shopper: ChatItem = { kind: 'shopper', id: '1', text: 'A black jacket under EGP 500' };
const step = (id: string, kind: TraceStep['kind'], name: string, status: TraceStep['status']): TraceStep => ({
  id,
  kind,
  name,
  status,
  summary: { en: 'Searching the brands', ar: 'بدور في البراندات' },
  durationMs: status === 'done' ? 450 : null,
});

const view = (partial: Partial<ChatState>) => (
  <ChatView createPhotoUrl={() => ''}
    state={{ items: [], trace: [], isThinking: false, hasFailed: false, ...partial }}
    sizeLabelOf={(id) => id.toUpperCase()}
    onSend={noop}
    onChooseVariant={noop}
    onAnswer={noop}
    onGiveAddress={noop}
    onOpenProduct={noop}
    onOpenOrders={noop}
    onOpenPhotoToShop={noop}
  />
);

export const previews: ScreenPreviews = {
  screen: 'MoreAI chat',
  states: [
    { name: 'Empty', element: view({}) },
    { name: 'Thinking with live trace', element: view({ items: [shopper], isThinking: true, trace: [step('a', 'model', 'muse-spark-1.3', 'running')] }) },
    { name: 'Tool running', element: view({ items: [shopper], isThinking: true, trace: [step('a', 'model', 'muse-spark-1.3', 'done'), step('b', 'tool', 'search_catalog', 'running')] }) },
    { name: 'Outfit suggested', element: view({ items: [shopper, { kind: 'learned', id: 'l', text: { en: 'Likes black', ar: 'بيحب الأسود' } }, { kind: 'suggestions', id: 's', pieces: [piece, piece] }], trace: [step('a', 'model', 'muse-spark-1.3', 'done'), step('b', 'tool', 'search_catalog', 'done')] }) },
    { name: 'Nothing fits', element: view({ items: [shopper, { kind: 'assistant', id: 'a', text: { en: 'Nothing fits that right now. Try a bigger budget?', ar: 'مفيش حاجة مناسبة دلوقتي. تجرب ميزانية أكبر؟' } }] }) },
    { name: 'Asking to confirm', element: view({ items: [shopper, { kind: 'confirm', id: 'c', answer: null, request: { id: 'c', kind: 'placeOrder', question: { en: 'Place this order?', ar: 'أطلب الأوردر ده؟' }, totalPiasters: 50_000 } }] }) },
    { name: 'Limit reached', element: view({ items: [shopper, { kind: 'limit', id: 'l', text: { en: 'You reached the limit of orders for today.', ar: 'وصلت لحد الأوردرات النهارده.' } }] }) },
    { name: 'Error', element: view({ items: [shopper], hasFailed: true }) },
  ],
};
