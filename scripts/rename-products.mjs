// Muse Spark writes each product's name and description from what it read in the photo.
// Run from the repo root: node --env-file=.env scripts/rename-products.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'apps/api/seed/names.json';
const CONCURRENCY = 12;
const { products, categories, colors } = JSON.parse(readFileSync('apps/api/seed/catalog.json', 'utf8'));
const visual = JSON.parse(readFileSync('apps/api/seed/visual.json', 'utf8'));
const names = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const schema = {
  type: 'object',
  properties: { nameEn: { type: 'string' }, nameAr: { type: 'string' }, descriptionEn: { type: 'string' }, descriptionAr: { type: 'string' } },
  required: ['nameEn', 'nameAr', 'descriptionEn', 'descriptionAr'],
  additionalProperties: false,
};

async function rename(product, avoid = []) {
  const color = colors.find(({ id }) => id === product.variants[0].colorId).name.en;
  const type = categories.find(({ id }) => id === product.categoryId).name.en;
  const instructions =
    'You name clothing products for an online store, from a description of the product photo. ' +
    `nameEn is 3 to 5 words in Title Case: it starts with the color word "${color}", ends with the product type "${type}", and in between names the most distinctive real detail, such as the fabric, cut or closure. No brand names, and no words like premium or stylish. ` +
    'nameAr is the same name in everyday Egyptian Arabic. descriptionEn is one short plain sentence about what the piece looks like and when to wear it. descriptionAr is the same in everyday Egyptian Arabic.' +
    (avoid.length > 0 ? ` These names are taken, so choose a different detail: ${avoid.join(', ')}.` : '');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch('https://api.meta.ai/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'muse-spark-1.3',
        reasoning: { effort: 'low' },
        instructions,
        input: [{ role: 'user', content: visual[product.id] }],
        text: { format: { type: 'json_schema', name: 'Names', schema } },
      }),
    });
    if (response.ok) {
      const body = await response.json();
      return JSON.parse(body.output.find((item) => item.type === 'message').content.find((part) => part.type === 'output_text').text);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
  }
  throw new Error(`${product.id}: gave up`);
}

const queue = products.filter(({ id }) => names[id] === undefined);
console.log(`Naming ${queue.length} products`);
let done = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      try {
        names[next.id] = await rename(next);
        done += 1;
        if (done % 25 === 0) {
          console.log(`${done} named`);
        }
      } catch (error) {
        console.log(String(error));
      }
    }
  }),
);

for (let round = 0; round < 3; round += 1) {
  const seen = new Map();
  const repeats = [];
  for (const product of products) {
    const key = names[product.id]?.nameEn.toLowerCase();
    if (seen.has(key)) {
      repeats.push(product);
    } else {
      seen.set(key, product.id);
    }
  }
  console.log(`Round ${round + 1}: ${repeats.length} repeated names`);
  if (repeats.length === 0) {
    break;
  }
  const taken = [...seen.keys()];
  await Promise.all(repeats.map(async (product) => { names[product.id] = await rename(product, taken.filter((name) => name.startsWith(names[product.id].nameEn.split(' ')[0].toLowerCase())).slice(0, 40)); }));
}
writeFileSync(OUT, JSON.stringify(names, null, 1));
console.log(`Finished: ${Object.keys(names).length} names, ${new Set(Object.values(names).map(({ nameEn }) => nameEn.toLowerCase())).size} different`);
