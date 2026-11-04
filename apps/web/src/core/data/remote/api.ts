import type { Category, Color, Merchant, Product, Size } from '../../domain/catalog';
import type { Preference } from '../../domain/taste';

export interface CatalogData {
  readonly merchants: readonly Merchant[];
  readonly products: readonly Product[];
  readonly categories: readonly Category[];
  readonly colors: readonly Color[];
  readonly sizes: readonly Size[];
}

export interface MetaOutputItem {
  readonly type: string;
  readonly name?: string;
  readonly arguments?: string;
  readonly call_id?: string;
  readonly content?: readonly { readonly type: string; readonly text?: string }[];
}

export interface MetaResponse {
  readonly id: string;
  readonly model?: string;
  readonly output: readonly MetaOutputItem[];
}

export type AgentInputItem =
  | { readonly role: 'user'; readonly content: string }
  | { readonly type: 'message'; readonly role: 'user'; readonly content: readonly ({ readonly type: 'input_text'; readonly text: string } | { readonly type: 'input_image'; readonly image_url: string })[] }
  | { readonly type: 'function_call_output'; readonly call_id: string; readonly output: string };

export interface SearchRequest {
  readonly text: string;
  readonly maxPricePiasters?: number;
  readonly categoryId?: string;
  readonly colorCode?: string;
}

export interface SearchAnswer {
  readonly limited: boolean;
  readonly matches: readonly { readonly id: string; readonly score: number }[];
}

export interface AgentStepRequest {
  readonly input: readonly AgentInputItem[];
  readonly previousResponseId: string | null;
  readonly preferences: readonly string[];
  readonly locale: string;
}

/** Everything the page asks the backend. Screens never see this: only the ports do. */
export interface ApiClient {
  catalog(): Promise<CatalogData>;
  agentStep(request: AgentStepRequest): Promise<MetaResponse>;
  search(request: SearchRequest): Promise<SearchAnswer>;
  readProductPhoto(image: string): Promise<MetaResponse>;
  detectPieces(image: string): Promise<MetaResponse>;
  segment(image: string, concept: string): Promise<MetaResponse>;
  getTaste(visitorId: string): Promise<readonly Preference[]>;
  putTaste(visitorId: string, preferences: readonly Preference[]): Promise<void>;
}

/** Today's limit is used up, or the model is busy. */
export class ApiLimitError extends Error {}

export function createApiClient(request: typeof fetch = (...args) => fetch(...args)): ApiClient {
  async function send<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await request(path, init);
    if (response.status === 429) {
      throw new ApiLimitError('limit');
    }
    if (!response.ok) {
      throw new Error(`The backend answered ${String(response.status)}`);
    }
    return (await response.json()) as T;
  }
  const post = <T,>(path: string, body: unknown) =>
    send<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  return {
    catalog: () => send('/api/catalog'),
    agentStep: (body) => post('/api/agent/step', body),
    search: (body) => post('/api/search', body),
    readProductPhoto: (image) => post('/api/vision/read', { image }),
    detectPieces: (image) => post('/api/vision/detect', { image }),
    segment: (image, concept) => post('/api/vision/segment', { image, concept }),
    getTaste: (visitorId) => send(`/api/taste/${encodeURIComponent(visitorId)}`),
    putTaste: async (visitorId, preferences) => {
      await send(`/api/taste/${encodeURIComponent(visitorId)}`, { method: 'PUT', body: JSON.stringify(preferences) });
    },
  };
}
