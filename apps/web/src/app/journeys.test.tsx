import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInLocale } from '../test/render';
import { App } from './App';
import { createAppContainer } from './container';

/** The whole product through the real screens and the real demo data, with nothing faked. */
function open(path = '/') {
  return renderInLocale(
    <MemoryRouter initialEntries={[path]}>
      <App container={createAppContainer({ latencyMs: 0 })} />
    </MemoryRouter>,
  );
}

const press = async (name: string | RegExp) => userEvent.click(await screen.findByRole('button', { name }));
const write = async (name: string, text: string) => {
  const field = await screen.findByRole('textbox', { name });
  await userEvent.clear(field);
  await userEvent.type(field, text);
};
const choosePhoto = async (label: string) =>
  fireEvent.change(await screen.findByLabelText(label), { target: { files: [new File(['x'], 'p.jpg', { type: 'image/jpeg' })] } });

async function chooseFirstSize() {
  const sizes = await screen.findAllByRole('button', { name: /^(XS|S|M|L|XL|XXL|\d+)$/ });
  const open = sizes.find((size) => !(size as HTMLButtonElement).disabled);
  expect(open).toBeDefined();
  await userEvent.click(open as HTMLElement);
}

async function enterAsClient() {
  await press('Join as client');
  await press("I'm 18 or older");
}

async function checkOut() {
  await press('Go to checkout');
  await write('Your name', 'Demo Shopper');
  await write('Mobile number', '01012345678');
  await write('Area', 'Maadi');
  await write('Street', 'Road 9');
  await write('Building', '12');
  await press('Review my order');
  await press('Place my order');
  await press('See my orders');
  expect(await screen.findByRole('heading', { name: 'My orders' })).toBeInTheDocument();
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
});

describe('the client’s journey', () => {
  it('goes from the first screen to a placed order with the agent, and respects the budget', async () => {
    open();
    await enterAsClient();
    await press('A black jacket under EGP 500');
    await screen.findByText('Here are the closest pieces. Pick a size to continue.');
    expect(screen.queryByText(/EGP.1,000/)).not.toBeInTheDocument();

    await chooseFirstSize();
    await press('Yes, confirm');
    await press('My cart, 1 piece');
    expect(await screen.findByRole('heading', { name: 'My cart' })).toBeInTheDocument();
    await checkOut();
    await waitFor(() => expect(screen.getByRole('button', { name: 'My cart' })).toBeInTheDocument());
  });

  it('hides the MoreAI button as soon as Settings says so', async () => {
    open();
    await enterAsClient();
    await press('My account');
    await press(/settings/i);
    expect(screen.getByRole('button', { name: 'Ask MoreAI' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('switch', { name: /MoreAI/ }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ask MoreAI' })).not.toBeInTheDocument());
  });
});

describe('the merchant’s journey', () => {
  it('joins, lets the AI read a photo, publishes, gets an order, and the client sees it accepted', async () => {
    open();
    await press('Join as merchant');
    await write('Brand name', 'Night Studio');
    await write('Bio', 'Calm winter pieces');
    await choosePhoto('Choose your brand’s image');
    await press('Join and add products');
    await press('Add my first product');
    await choosePhoto('Choose a product photo');
    await write('Name in English', 'Night jacket');
    await write('Price in EGP', '450');
    await press('Publish');
    await screen.findByText('Published. Shoppers can find it now.');

    await press('Back to the first screen');
    await enterAsClient();
    const menu = await screen.findByRole('navigation', { name: 'Main menu' });
    await userEvent.click(within(menu).getByRole('button', { name: 'Search' }));
    await write('What are you looking for?', 'Night jacket');
    await userEvent.click(within(await screen.findByRole('main')).getByRole('button', { name: 'Search' }));
    await press(/Night jacket/);
    await chooseFirstSize();
    await press('Add to cart');
    await press('Open my cart');
    await checkOut();

    await press('Back to the first screen');
    await press('Join as merchant');
    const merchantMenu = await screen.findByRole('navigation', { name: 'Merchant menu' });
    await userEvent.click(within(merchantMenu).getByRole('button', { name: 'Orders' }));
    await press('Accept');
    await screen.findByText('Nothing here right now.');

    await press('Back to the first screen');
    await press('Join as client');
    await press('My account');
    await press('My orders');
    await press(/Night Studio/);
    expect((await screen.findAllByText('Accepted')).length).toBeGreaterThan(0);
  });
});

describe('the shells', () => {
  it('asks a client to pass the gate first', async () => {
    open('/client/cart');
    expect(await screen.findByRole('button', { name: "I'm 18 or older" })).toBeInTheDocument();
  });

  it('sends someone who hasn’t joined to the join form', async () => {
    open('/merchant/orders');
    expect(await screen.findByRole('heading', { name: 'Join as a merchant' })).toBeInTheDocument();
  });

  it('gives every screen one main area, a skip link and the demo notice', async () => {
    open('/client/welcome');
    await screen.findByRole('button', { name: "I'm 18 or older" });
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Skip to the content' })).toHaveAttribute('href', '#main');
    expect(screen.getByText('Demo: brands and products are made up')).toBeInTheDocument();
  });
});
