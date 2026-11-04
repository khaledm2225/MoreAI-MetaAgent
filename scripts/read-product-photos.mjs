// Muse Spark reads each generated product photo into visualDescription, the text the search index uses.
// Run from the repo root: node --env-file=.env scripts/read-product-photos.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'apps/api/seed/visual.json';
const CONCURRENCY = 12;
const { products } = JSON.parse(readFileSync('apps/api/seed/catalog.json', 'utf8'));
const visual = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const schema = { type: 'object', properties: { visualDescription: { type: 'string' } }, required: ['visualDescription'], additionalProperties: false };

async function read(product) {
  const image = `data:image/jpeg;base64,${readFileSync(`apps/web/public/products/${product.id}.jpg`).toString('base64')}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch('https://api.meta.ai/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'muse-spark-1.3',
        instructions: 'Describe this clothing product for a search index, in one English sentence: its type, color, cut, fabric and visible details. Describe only what you see.',
        input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Read this product photo.' }, { type: 'input_image', image_url: image }] }],
        text: { format: { type: 'json_schema', name: 'Visual', schema } },
      }),
    });
    if (response.ok) {
      const body = await response.json();
      const text = body.output.find((item) => item.type === 'message').content.find((part) => part.type === 'output_text').text;
      return JSON.parse(text).visualDescription;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
  }
  throw new Error(`${product.id}: gave up`);
}

const queue = products.filter(({ id }) => visual[id] === undefined && existsSync(`apps/web/public/products/${id}.jpg`));
console.log(`Reading ${queue.length} photos`);
let done = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      try {
        visual[next.id] = await read(next);
        done += 1;
        if (done % 20 === 0) {
          writeFileSync(OUT, JSON.stringify(visual, null, 1));
          console.log(`${done} read`);
        }
      } catch (error) {
        console.log(String(error));
      }
    }
  }),
);
writeFileSync(OUT, JSON.stringify(visual, null, 1));
console.log(`Finished: ${done} read`);
