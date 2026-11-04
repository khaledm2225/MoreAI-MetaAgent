import { AGENT_INSTRUCTIONS, AGENT_MODEL, AGENT_TOOLS, DETECT_INSTRUCTIONS, DETECT_SCHEMA, LISTING_INSTRUCTIONS, LISTING_SCHEMA, SEGMENT_MODEL, VISION_MODEL } from './agentConfig';
import type { Env } from './env';

const META_RESPONSES = 'https://api.meta.ai/v1/responses';
const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5';
const MAX_BODY_BYTES = 2_000_000;
const MAX_IMAGE_CHARS = 1_500_000;
const MAX_INPUT_ITEMS = 24;
const MAX_TEXT_CHARS = 2_000;
const TOP_K = 50;

/** The spending guard, since Meta's API has no hard cap: model calls per day, for everyone and per visitor. */
export const LIMITS = { modelCallsPerDay: 1_000, modelCallsPerVisitor: 120, searchesPerDay: 40 } as const;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers } });
const refuse = (status: number, code: string) => json({ error: code }, status);

async function hash(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest).slice(0, 8)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function within(env: Env, key: string, max: number): Promise<boolean> {
  const row = await env.DB.prepare('INSERT INTO daily_usage (key, count) VALUES (?1, 1) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(key)
    .first<{ count: number }>();
  return (row?.count ?? 0) <= max;
}

const today = () => new Date().toISOString().slice(0, 10);

async function modelCallAllowed(request: Request, env: Env): Promise<boolean> {
  const day = today();
  const visitor = await hash(`${day}:${request.headers.get('CF-Connecting-IP') ?? 'unknown'}`);
  return (await within(env, `model:${day}`, LIMITS.modelCallsPerDay)) && within(env, `visitor:${visitor}`, LIMITS.modelCallsPerVisitor);
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return null;
  }
  try {
    const body: unknown = JSON.parse(text);
    return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** One step only: the Worker stays thin, and hands Meta's answer straight back. */
async function callMeta(env: Env, body: unknown): Promise<Response> {
  const upstream = await fetch(META_RESPONSES, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.MODEL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (upstream.status === 429) {
    return refuse(429, 'busy');
  }
  if (!upstream.ok) {
    console.log('Meta refused a call', upstream.status, (await upstream.text()).slice(0, 300));
    return refuse(502, 'model_failed');
  }
  return new Response(upstream.body, { headers: JSON_HEADERS });
}

const IMAGE_DATA = /^data:image\/(jpeg|png|webp);base64,/;

/** The agent sees this site's product photos, and a photo the shopper attached. Never another site's address. */
function isAllowedAgentImage(image: unknown, origin: string): boolean {
  if (typeof image !== 'string') {
    return false;
  }
  return image.startsWith(`${origin}/products/`) || (image.length <= MAX_IMAGE_CHARS && IMAGE_DATA.test(image));
}

export function agentInputProblem(input: unknown, origin: string): string | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_INPUT_ITEMS) {
    return 'bad_input';
  }
  for (const item of input as readonly Record<string, unknown>[]) {
    const content = item.content;
    if (typeof content === 'string' && content.length > MAX_TEXT_CHARS) {
      return 'too_long';
    }
    if (Array.isArray(content)) {
      for (const part of content as readonly Record<string, unknown>[]) {
        if (part.type === 'input_image' && !isAllowedAgentImage(part.image_url, origin)) {
          return 'bad_image';
        }
        if (part.type === 'input_text' && typeof part.text === 'string' && part.text.length > MAX_TEXT_CHARS) {
          return 'too_long';
        }
      }
    }
    if (item.type !== undefined && !['message', 'function_call_output'].includes(String(item.type))) {
      return 'bad_input';
    }
  }
  return null;
}

async function agentStep(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (body === null) {
    return refuse(400, 'bad_body');
  }
  const problem = agentInputProblem(body.input, new URL(request.url).origin);
  if (problem !== null) {
    return refuse(400, problem);
  }
  if (!(await modelCallAllowed(request, env))) {
    return refuse(429, 'daily_limit');
  }
  const preferences = Array.isArray(body.preferences) ? body.preferences.filter((item) => typeof item === 'string').slice(0, 30).join('; ').slice(0, MAX_TEXT_CHARS) : '';
  const language = body.locale === 'ar' ? 'Arabic' : 'English';
  return callMeta(env, {
    model: AGENT_MODEL,
    instructions: `${AGENT_INSTRUCTIONS}\n\nThe app is set to ${language}.${preferences === '' ? '' : `\nWhat this shopper told you about their taste: ${preferences}`}`,
    tools: AGENT_TOOLS,
    // A tight tool loop that a person is watching: answer quickly.
    reasoning: { effort: 'low' },
    input: body.input,
    ...(typeof body.previousResponseId === 'string' ? { previous_response_id: body.previousResponseId } : {}),
  });
}

const imageOf = (body: Record<string, unknown> | null): string | null => {
  const image = body?.image;
  return typeof image === 'string' && image.length <= MAX_IMAGE_CHARS && IMAGE_DATA.test(image) ? image : null;
};

async function readPhoto(request: Request, env: Env, instructions: string, name: string, schema: unknown): Promise<Response> {
  const image = imageOf(await readBody(request));
  if (image === null) {
    return refuse(400, 'bad_image');
  }
  if (!(await modelCallAllowed(request, env))) {
    return refuse(429, 'daily_limit');
  }
  return callMeta(env, {
    model: VISION_MODEL,
    reasoning: { effort: 'low' },
    instructions,
    input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Read this photo.' }, { type: 'input_image', image_url: image }] }],
    text: { format: { type: 'json_schema', name, schema } },
  });
}

async function segment(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const image = imageOf(body);
  const concept = body?.concept;
  if (image === null || typeof concept !== 'string' || concept.length === 0 || concept.length > 80) {
    return refuse(400, 'bad_request');
  }
  if (!(await modelCallAllowed(request, env))) {
    return refuse(429, 'daily_limit');
  }
  return callMeta(env, {
    model: SEGMENT_MODEL,
    input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: concept }, { type: 'input_image', image_url: image }] }],
  });
}

async function search(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const text = body?.text;
  if (typeof text !== 'string' || text.trim() === '' || text.length > 300) {
    return refuse(400, 'bad_text');
  }
  if (!(await within(env, `search:${today()}`, LIMITS.searchesPerDay))) {
    return json({ limited: true, matches: [] });
  }
  const filter: Record<string, unknown> = {};
  if (typeof body?.maxPricePiasters === 'number' && Number.isFinite(body.maxPricePiasters)) {
    filter.pricePiasters = { $lte: body.maxPricePiasters };
  }
  if (typeof body?.categoryId === 'string') {
    filter.categoryId = { $eq: body.categoryId };
  }
  if (typeof body?.colorCode === 'string') {
    filter.colorCode = { $eq: body.colorCode };
  }
  const { data } = await env.AI.run(EMBEDDING_MODEL, { text: [text] });
  const vector = data[0];
  if (vector === undefined) {
    return refuse(502, 'embedding_failed');
  }
  const { matches } = await env.VECTORS.query(vector, {
    topK: TOP_K,
    returnValues: false,
    returnMetadata: 'none',
    ...(Object.keys(filter).length > 0 ? { filter } : {}),
  });
  return json({ limited: false, matches: matches.map(({ id, score }) => ({ id, score })) });
}

async function catalog(env: Env): Promise<Response> {
  const queries = ['SELECT * FROM merchants', 'SELECT * FROM categories ORDER BY sortOrder', 'SELECT * FROM colors', 'SELECT * FROM sizes ORDER BY sortOrder', "SELECT * FROM products WHERE status = 'ACTIVE'", 'SELECT * FROM product_variants'];
  const results = await env.DB.batch(queries.map((sql) => env.DB.prepare(sql)));
  const [merchants, categories, colors, sizes, products, variants] = results.map((result) => (result.results ?? []) as readonly Record<string, unknown>[]) as [
    readonly Record<string, unknown>[], readonly Record<string, unknown>[], readonly Record<string, unknown>[], readonly Record<string, unknown>[], readonly Record<string, unknown>[], readonly Record<string, unknown>[],
  ];
  const variantsByProduct = new Map<unknown, Record<string, unknown>[]>();
  for (const variant of variants) {
    const list = variantsByProduct.get(variant.productId) ?? [];
    list.push({ ...variant, isAvailable: variant.isAvailable === 1 });
    variantsByProduct.set(variant.productId, list);
  }
  return json(
    {
      merchants: merchants.map((row) => ({ id: row.id, slug: row.slug, name: row.name, bio: { en: row.bioEn, ar: row.bioAr }, logoPath: row.logoPath, status: row.status, deliveryFeePiasters: row.deliveryFeePiasters })),
      categories: categories.map((row) => ({ id: row.id, parentId: row.parentId, slug: row.slug, name: { en: row.nameEn, ar: row.nameAr }, sortOrder: row.sortOrder })),
      colors: colors.map((row) => ({ id: row.id, code: row.code, name: { en: row.nameEn, ar: row.nameAr }, hex: row.hex })),
      sizes,
      products: products.map((row) => ({
        id: row.id,
        merchantId: row.merchantId,
        categoryId: row.categoryId,
        name: { en: row.nameEn, ar: row.nameAr },
        description: { en: row.descriptionEn, ar: row.descriptionAr },
        visualDescription: row.visualDescription,
        gender: row.gender,
        status: row.status,
        pricePiasters: row.pricePiasters,
        images: [{ id: `${String(row.id)}-image`, path: row.imagePath, alt: { en: row.nameEn, ar: row.nameAr }, position: 0 }],
        variants: variantsByProduct.get(row.id) ?? [],
      })),
    },
    200,
    { 'Cache-Control': 'public, max-age=300' },
  );
}

const VISITOR_ID = /^[a-zA-Z0-9-]{8,64}$/;

async function taste(request: Request, env: Env, visitorId: string): Promise<Response> {
  if (!VISITOR_ID.test(visitorId)) {
    return refuse(400, 'bad_visitor');
  }
  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT preferences FROM taste_profiles WHERE visitorId = ?1').bind(visitorId).first<{ preferences: string }>();
    return new Response(row?.preferences ?? '[]', { headers: JSON_HEADERS });
  }
  const body = await request.text();
  if (body.length > 8_000) {
    return refuse(400, 'too_long');
  }
  await env.DB.prepare('INSERT INTO taste_profiles (visitorId, preferences, updatedAt) VALUES (?1, ?2, ?3) ON CONFLICT(visitorId) DO UPDATE SET preferences = ?2, updatedAt = ?3')
    .bind(visitorId, body, new Date().toISOString())
    .run();
  return json({ saved: true });
}

async function indexVectors(request: Request, env: Env): Promise<Response> {
  if (env.ADMIN_TOKEN === '' || request.headers.get('x-admin-token') !== env.ADMIN_TOKEN) {
    return refuse(403, 'forbidden');
  }
  const body = (await readBody(request)) as { items?: readonly { id: string; text: string; metadata: Record<string, string | number> }[] } | null;
  const items = body?.items ?? [];
  const { data } = await env.AI.run(EMBEDDING_MODEL, { text: items.map(({ text }) => text) });
  await env.VECTORS.upsert(items.map((item, index) => ({ id: item.id, values: data[index] ?? [], metadata: item.metadata })));
  return json({ indexed: items.length });
}

export async function handle(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const route = `${request.method} ${pathname}`;
  try {
    switch (route) {
      case 'GET /api/catalog':
        return await catalog(env);
      case 'POST /api/agent/step':
        return await agentStep(request, env);
      case 'POST /api/search':
        return await search(request, env);
      case 'POST /api/vision/read':
        return await readPhoto(request, env, LISTING_INSTRUCTIONS, 'Listing', LISTING_SCHEMA);
      case 'POST /api/vision/detect':
        return await readPhoto(request, env, DETECT_INSTRUCTIONS, 'Pieces', DETECT_SCHEMA);
      case 'POST /api/vision/segment':
        return await segment(request, env);
      case 'POST /api/admin/index-vectors':
        return await indexVectors(request, env);
    }
    const tasteMatch = /^\/api\/taste\/([^/]+)$/.exec(pathname);
    if (tasteMatch?.[1] !== undefined && (request.method === 'GET' || request.method === 'PUT')) {
      return await taste(request, env, tasteMatch[1]);
    }
    return refuse(404, 'not_found');
  } catch (error) {
    console.log('Request failed', route, String(error).slice(0, 300));
    return refuse(500, 'failed');
  }
}

export default { fetch: handle };
