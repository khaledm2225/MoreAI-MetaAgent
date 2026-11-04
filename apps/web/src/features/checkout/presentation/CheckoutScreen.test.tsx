import { catalogProblems } from '@metaagent/i18n';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CartLine } from '../../../core/domain/cart';
import type { Order, PlaceOrderResult } from '../../../core/domain/order';
import { fakeCatalog, failing } from '../../../test/ports';
import { renderInLocale } from '../../../test/render';
import { CheckoutScreen, type CheckoutScreenProps } from './CheckoutScreen';
import { strings } from './strings';

const line = { id: 'l', merchantId: 'm', unitPricePiasters: 50_000, quantity: 1, availability: 'available' } as CartLine;
const order = { id: 'o', orderNumber: 'M1000', merchantName: 'Brand', totalPiasters: 55_000 } as Order;

function setup(placeOrder: (address: unknown) => Promise<PlaceOrderResult>, overrides: Partial<CheckoutScreenProps> = {}) {
  const callbacks = { onOpenOrders: vi.fn(), onOpenCart: vi.fn() };
  const spy = vi.fn(placeOrder);
  renderInLocale(
    <CheckoutScreen orders={{ placeOrder: spy }} cart={{ listLines: () => Promise.resolve([line]) }} catalog={fakeCatalog([])} {...callbacks} {...overrides} />,
  );
  return { ...callbacks, placeOrder: spy };
}

async function fillAddress() {
  await userEvent.type(screen.getByRole('textbox', { name: 'Your name' }), 'Khaled');
  await userEvent.type(screen.getByRole('textbox', { name: 'Mobile number' }), '01012345678');
  await userEvent.type(screen.getByRole('textbox', { name: 'Area' }), 'Maadi');
  await userEvent.type(screen.getByRole('textbox', { name: 'Street' }), 'Road 9');
  await userEvent.type(screen.getByRole('textbox', { name: 'Building' }), '12');
  await userEvent.click(screen.getByRole('button', { name: 'Review my order' }));
}

describe('CheckoutScreen', () => {
  it('has complete words in both languages', () => {
    expect(catalogProblems(strings)).toEqual([]);
  });

  it('won’t continue with a bad address', async () => {
    const { placeOrder } = setup(() => Promise.resolve({ kind: 'placed', orders: [order] }));
    await userEvent.click(screen.getByRole('button', { name: 'Review my order' }));
    expect(screen.getByRole('textbox', { name: 'Your name' })).toHaveAttribute('aria-invalid', 'true');
    expect(placeOrder).not.toHaveBeenCalled();
  });

  it('places nothing until the client confirms, then shows the placed order', async () => {
    const { placeOrder, onOpenOrders } = setup(() => Promise.resolve({ kind: 'placed', orders: [order] }));
    await fillAddress();
    const dialog = await screen.findByRole('dialog', { name: 'Place this order?' });
    expect(dialog).toHaveTextContent('EGP');
    expect(placeOrder).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Place my order' }));
    expect(await screen.findByRole('heading', { name: 'Your order is placed' })).toBeInTheDocument();
    expect(placeOrder).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'See my orders' }));
    expect(onOpenOrders).toHaveBeenCalledTimes(1);
  });

  it('goes back when the client says not now', async () => {
    const { placeOrder } = setup(() => Promise.resolve({ kind: 'placed', orders: [order] }));
    await fillAddress();
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(placeOrder).not.toHaveBeenCalled();
  });

  it.each([
    [{ kind: 'dailyLimit', reason: 'SHOPPER_DAILY_LIMIT' } as const, 'You reached today’s limit'],
    [{ kind: 'dailyLimit', reason: 'BRAND_DAILY_LIMIT', merchantId: 'm' } as const, 'You reached today’s limit'],
    [{ kind: 'blocked', merchantId: 'm' } as const, 'A brand can’t accept this order'],
    [{ kind: 'changed' } as const, 'Your cart changed'],
    [{ kind: 'empty' } as const, 'Your cart is empty'],
  ])('explains %j', async (result, heading) => {
    setup(() => Promise.resolve(result));
    await fillAddress();
    await userEvent.click(await screen.findByRole('button', { name: 'Place my order' }));
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('says the order wasn’t placed when it fails', async () => {
    setup(failing);
    await fillAddress();
    await userEvent.click(await screen.findByRole('button', { name: 'Place my order' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('wasn’t placed');
  });

  it('never mentions a payment method', () => {
    const allWords = JSON.stringify(strings).toLowerCase();
    expect(allWords).not.toMatch(/cash|payment|credit card|كاش|فلوس|فيزا/);
  });
});
