import type { Id } from '../../domain/catalog';
import type { Preference } from '../../domain/taste';
import { createStaticPorts, type AppPorts } from '../static';
import { demoSizes } from '../static/demoCatalog';
import { DemoWorld } from '../static/demoWorld';
import { cartGrandTotal } from '../static/repositories';
import { createRemoteAgentGateway } from './agent';
import { createApiClient, type ApiClient } from './api';
import { photoToDataUrl } from './photo';
import { createRemoteProductSearch } from './search';
import { createRemoteListingAssistant, createRemotePhotoToShop } from './vision';

export interface RemotePortsOptions {
  readonly api?: ApiClient;
  readonly clock: () => Date;
  /** Who this browser is, with no login, so its taste profile comes back next time. */
  readonly visitorId: string;
  /** This site's public address. */
  readonly origin: string;
  readonly locale: () => string;
}

/**
 * The main path on the real backend: the catalog from D1, search on vectors, the agent
 * on Muse, photos through Muse and SAM, and the taste profile. Each visitor's cart and
 * orders stay in their own browser, so people testing a public link never see each other's.
 */
export async function createRemotePorts({ api = createApiClient(), clock, visitorId, origin, locale }: RemotePortsOptions): Promise<AppPorts> {
  const world = new DemoWorld({ latencyMs: 0, clock });
  const [catalog, taste] = await Promise.allSettled([api.catalog(), api.getTaste(visitorId)]);
  let sizes = demoSizes;
  if (catalog.status === 'fulfilled' && catalog.value.products.length > 0) {
    world.merchants = catalog.value.merchants;
    world.products = catalog.value.products;
    sizes = catalog.value.sizes;
  }
  if (taste.status === 'fulfilled') {
    world.preferences = taste.value;
  }

  const ports = createStaticPorts({ latencyMs: 0, clock }, world);
  const productSearch = createRemoteProductSearch(api, ports.productSearch);
  const merchantById = (id: Id) => world.merchantById(id);

  let saved: readonly Preference[] = world.preferences;
  ports.preferences.subscribe(() => {
    if (world.preferences !== saved) {
      saved = world.preferences;
      void api.putTaste(visitorId, saved).catch(() => undefined);
    }
  });

  return {
    ...ports,
    productSearch,
    agent: createRemoteAgentGateway({
      api,
      search: productSearch,
      cart: ports.cart,
      orders: ports.orders,
      preferences: ports.preferences,
      productById: (id) => world.productById(id),
      merchantById,
      sizes: () => sizes,
      cartTotal: () => cartGrandTotal(world),
      locale,
      publicPhotoUrl: (path) => (path.startsWith('/products/') && origin.startsWith('https://') ? `${origin}${path}` : null),
      now: () => clock().getTime(),
      newId: (prefix) => world.nextId(prefix),
      toDataUrl: photoToDataUrl,
    }),
    photoToShop: createRemotePhotoToShop({ api, search: productSearch, merchantById, toDataUrl: photoToDataUrl }),
    listingAssistant: createRemoteListingAssistant(api, photoToDataUrl),
  };
}
