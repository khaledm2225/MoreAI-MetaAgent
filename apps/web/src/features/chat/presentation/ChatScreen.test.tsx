import { catalogProblems } from '@metaagent/i18n';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AgentEvent, AgentInput } from '../../../core/domain/agent';
import type { Merchant, Product } from '../../../core/domain/catalog';
import type { Order } from '../../../core/domain/order';
import type { AgentGateway } from '../../../core/domain/ports';
import { renderInLocale } from '../../../test/render';
import { ChatScreen, type ChatScreenProps } from './ChatScreen';
import { strings } from './strings';

const merchant: Merchant = { id: 'm', slug: 'b', name: 'Brand', bio: { en: 'b', ar: 'ب' }, logoPath: null, status: 'LIVE', deliveryFeePiasters: 0 };
const product: Product = {
  id: 'p',
  merchantId: 'm',
  categoryId: 'c',
  name: { en: 'Black jacket', ar: 'جاكيت أسود' },
  description: { en: 'd', ar: 'د' },
  visualDescription: 'v',
  gender: 'UNISEX',
  status: 'ACTIVE',
  pricePiasters: 45_000,
  images: [],
  variants: [
    { id: 'v-m', productId: 'p', colorId: 'c', sizeId: 's-m', pricePiasters: null, stockQuantity: 2, isAvailable: true },
    { id: 'v-l', productId: 'p', colorId: 'c', sizeId: 's-l', pricePiasters: null, stockQuantity: 0, isAvailable: true },
  ],
};

function fakeAgent(replies: (input: AgentInput) => readonly AgentEvent[]) {
  const inputs: AgentInput[] = [];
  const agent: AgentGateway = {
    async *send(input) {
      inputs.push(input);
      yield* replies(input);
    },
  };
  return { agent, inputs };
}

const catalog: ChatScreenProps['catalog'] = {
  listSizes: () =>
    Promise.resolve([
      { id: 's-m', label: 'M', sortOrder: 1 },
      { id: 's-l', label: 'L', sortOrder: 2 },
    ]),
};

function setup(agent: AgentGateway, locale: 'en' | 'ar' = 'en') {
  const callbacks = { onOpenProduct: vi.fn(), onOpenOrders: vi.fn(), onOpenPhotoToShop: vi.fn() };
  renderInLocale(<ChatScreen agent={agent} catalog={catalog} {...callbacks} />, locale);
  return callbacks;
}

async function say(text: string) {
  await userEvent.type(screen.getByRole('textbox', { name: 'Your message' }), text);
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));
}

describe('ChatScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings, { sameInBoth: ['title'] })).toEqual([]);
  });

  it('starts with an invitation and examples', () => {
    setup(fakeAgent(() => []).agent);
    expect(screen.getByRole('heading', { name: 'What are you looking for?' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Examples' })).toBeInTheDocument();
  });

  it('sends an example with one press', async () => {
    const { agent, inputs } = fakeAgent(() => []);
    setup(agent);
    await userEvent.click(screen.getByRole('button', { name: 'A black jacket under EGP 500' }));
    expect(inputs).toEqual([{ kind: 'text', text: 'A black jacket under EGP 500' }]);
  });

  it('shows the client’s message and clears the field', async () => {
    const { agent } = fakeAgent(() => []);
    setup(agent);
    await say('a jacket');
    expect(screen.getByText('a jacket')).toHaveAttribute('dir', 'auto');
    expect(screen.getByRole('textbox', { name: 'Your message' })).toHaveValue('');
  });

  it('won’t send an empty message', () => {
    setup(fakeAgent(() => []).agent);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('shows every model and tool call in the live trace, updating as they finish', async () => {
    const summary = { en: 'Searching the brands', ar: 'بدور' };
    const { agent } = fakeAgent(() => [
      { type: 'trace', step: { id: 't', kind: 'tool', name: 'search_catalog', summary, status: 'running', durationMs: null } },
      { type: 'trace', step: { id: 't', kind: 'tool', name: 'search_catalog', summary, status: 'done', durationMs: 120 } },
    ]);
    setup(agent);
    await say('a jacket');
    const panel = screen.getByRole('complementary', { name: 'Live trace' });
    expect(within(panel).getAllByText('search_catalog')).toHaveLength(1);
    expect(within(panel).getByText('Done in 120 ms')).toBeInTheDocument();
  });

  it('runs the suggestion, size and confirmation steps, and sends only what the client chose', async () => {
    const { agent, inputs } = fakeAgent((input) => {
      if (input.kind === 'text') {
        return [{ type: 'suggestions', id: 's', pieces: [{ product, merchant, reason: { en: 'Close to your words', ar: 'قريب' } }] }];
      }
      if (input.kind === 'chooseVariant') {
        return [{ type: 'confirm', request: { id: 'c', kind: 'addToCart', question: { en: 'Add it?', ar: 'أضيف؟' }, pieces: [] } }];
      }
      return [];
    });
    setup(agent);
    await say('a jacket');
    expect(await screen.findByText('Close to your words')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'L' })).toBeDisabled();
    await userEvent.click(await screen.findByRole('button', { name: 'M' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, confirm' }));
    expect(inputs).toEqual([
      { kind: 'text', text: 'a jacket' },
      { kind: 'chooseVariant', productId: 'p', variantId: 'v-m' },
      { kind: 'confirmation', requestId: 'c', accepted: true },
    ]);
    expect(screen.getByText('You confirmed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yes, confirm' })).not.toBeInTheDocument();
  });

  it('shows the exact total before an order is placed', async () => {
    const { agent } = fakeAgent(() => [
      { type: 'confirm', request: { id: 'c', kind: 'placeOrder', question: { en: 'Place it?', ar: 'أطلب؟' }, totalPiasters: 50_000 } },
    ]);
    setup(agent);
    await say('checkout');
    expect(await screen.findByText(/Total: EGP.500/)).toBeInTheDocument();
  });

  it('shows the placed order and leads to the orders', async () => {
    const order = { id: 'o', merchantName: 'Brand', totalPiasters: 50_000 } as Order;
    const { agent } = fakeAgent(() => [{ type: 'orderPlaced', orders: [order] }]);
    const { onOpenOrders } = setup(agent);
    await say('yes');
    expect(await screen.findByRole('heading', { name: 'Your order is placed' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'See my orders' }));
    expect(onOpenOrders).toHaveBeenCalledTimes(1);
  });

  it('shows a limit', async () => {
    const { agent } = fakeAgent(() => [{ type: 'limitReached', text: { en: 'Limit reached', ar: 'الحد' } }]);
    setup(agent);
    await say('order');
    expect(await screen.findByRole('alert')).toHaveTextContent('Limit reached');
  });

  it('shows a failure and keeps the chat usable', async () => {
    const agent: AgentGateway = {
      // A generator needs a yield to be typed, and this one fails before reaching it.
      async *send() {
        await Promise.reject(new Error('down'));
        yield { type: 'limitReached', text: { en: '', ar: '' } };
      },
    };
    setup(agent);
    await say('a jacket');
    expect(await screen.findByRole('alert')).toHaveTextContent('That didn’t work');
    expect(screen.getByRole('textbox', { name: 'Your message' })).toBeEnabled();
  });

  it('keeps the conversation when the shopper leaves and comes back', async () => {
    const memory = { state: null };
    const { agent } = fakeAgent(() => []);
    const first = renderInLocale(<ChatScreen agent={agent} catalog={catalog} onOpenProduct={vi.fn()} onOpenOrders={vi.fn()} onOpenPhotoToShop={vi.fn()} memory={memory} />);
    await say('a jacket');
    first.unmount();
    renderInLocale(<ChatScreen agent={agent} catalog={catalog} onOpenProduct={vi.fn()} onOpenOrders={vi.fn()} onOpenPhotoToShop={vi.fn()} memory={memory} />);
    expect(screen.getByText('a jacket')).toBeInTheDocument();
  });

  describe('adding a photo', () => {
    const file = (type = 'image/jpeg') => new File(['x'], 'me.jpg', { type });
    const attach = (photo: File) => fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [photo] } });

    it('sends the photo with the words, and shows it in the conversation', async () => {
      URL.createObjectURL = vi.fn(() => 'blob:me');
      const { agent, inputs } = fakeAgent(() => []);
      setup(agent);
      attach(file());
      await say('A jacket in the same color');
      expect(inputs[0]).toMatchObject({ kind: 'text', text: 'A jacket in the same color', photo: { previewUrl: 'blob:me', type: 'image/jpeg' } });
      expect(within(screen.getByRole('log')).getByRole('img', { name: 'Your photo' })).toHaveAttribute('src', 'blob:me');
    });

    it('can send a photo with no words', async () => {
      URL.createObjectURL = vi.fn(() => 'blob:me');
      const { agent, inputs } = fakeAgent(() => []);
      setup(agent);
      attach(file());
      await userEvent.click(screen.getByRole('button', { name: 'Send' }));
      expect(inputs[0]).toMatchObject({ text: 'What goes with this?' });
    });

    it('can remove it before sending', async () => {
      URL.createObjectURL = vi.fn(() => 'blob:me');
      const { agent, inputs } = fakeAgent(() => []);
      setup(agent);
      attach(file());
      await userEvent.click(screen.getByRole('button', { name: 'Remove the photo' }));
      await say('a jacket');
      expect(inputs[0]).toEqual({ kind: 'text', text: 'a jacket' });
    });

    it('refuses a file that isn’t a photo', () => {
      setup(fakeAgent(() => []).agent);
      attach(file('application/pdf'));
      expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG');
    });
  });

  it('leads to photo search', async () => {
    const { onOpenPhotoToShop } = setup(fakeAgent(() => []).agent);
    await userEvent.click(screen.getByRole('button', { name: 'Search with a photo' }));
    expect(onOpenPhotoToShop).toHaveBeenCalledTimes(1);
  });

  it('speaks Arabic', () => {
    setup(fakeAgent(() => []).agent, 'ar');
    expect(screen.getByRole('heading', { name: 'بتدور على إيه؟' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'الخطوات مباشرة' })).toBeInTheDocument();
  });
});
