// Generates one real looking photo per catalog product with Muse Image.
// Run from the repo root: node --env-file=.env scripts/generate-product-photos.mjs [limit]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'apps/web/public/products';
const CONCURRENCY = 8;
const limit = Number(process.argv[2] ?? Infinity);
const { products } = JSON.parse(readFileSync('apps/api/seed/catalog.json', 'utf8'));
mkdirSync(OUT, { recursive: true });

const promptFor = (product) =>
  `Professional e-commerce product photograph of one ${product.name.en.toLowerCase()}, ${product.visualDescription}. ` +
  'The single piece is neatly presented from the front, centered, filling most of the frame, on a plain warm beige cream background, never white. ' +
  'Real photography that looks like a brand new 2026 fashion campaign: crisp, bright, clean light, a true neutral white balance, sharp fabric detail. ' +
  'No people, no hands, no mannequin, no props, no text, no logos, no labels, no brand names.';

async function generate(product) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch('https://api.meta.ai/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'muse-image-1.0', prompt: promptFor(product), size: '1024x1280', output_format: 'jpeg', n: 1 }),
    });
    if (response.ok) {
      const { data } = await response.json();
      const path = `${OUT}/${product.id}.jpg`;
      writeFileSync(path, Buffer.from(data[0].b64_json, 'base64'));
      execFileSync('sips', ['-Z', '800', '-s', 'format', 'jpeg', '-s', 'formatOptions', '72', path, '--out', path], { stdio: 'ignore' });
      return;
    }
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`${product.id}: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
  }
  throw new Error(`${product.id}: gave up after retries`);
}

const queue = products.filter(({ id }) => !existsSync(`${OUT}/${id}.jpg`)).slice(0, limit);
let done = 0;
let failed = 0;
console.log(`Generating ${queue.length} photos`);
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      try {
        await generate(next);
        done += 1;
      } catch (error) {
        failed += 1;
        console.log(String(error));
      }
      if ((done + failed) % 10 === 0) {
        console.log(`${done} done, ${failed} failed, ${new Date().toTimeString().slice(0, 8)}`);
      }
    }
  }),
);
console.log(`Finished: ${done} done, ${failed} failed`);
