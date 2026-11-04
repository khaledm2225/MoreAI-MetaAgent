// Turns the catalog and what Muse read from each photo into SQL for D1, and vectors to index.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const { merchants, products, categories, colors, sizes } = JSON.parse(readFileSync('apps/api/seed/catalog.json', 'utf8'));
const visual = existsSync('apps/api/seed/visual.json') ? JSON.parse(readFileSync('apps/api/seed/visual.json', 'utf8')) : {};
const names = existsSync('apps/api/seed/names.json') ? JSON.parse(readFileSync('apps/api/seed/names.json', 'utf8')) : {};
for (const product of products) {
  const written = names[product.id];
  if (written !== undefined) {
    product.name = { en: written.nameEn, ar: written.nameAr };
    product.description = { en: written.descriptionEn, ar: written.descriptionAr };
  }
}
const sql = (value) => (value === null || value === undefined ? 'NULL' : typeof value === 'number' ? String(value) : typeof value === 'boolean' ? (value ? '1' : '0') : `'${String(value).replaceAll("'", "''")}'`);
const insert = (table, row) => `INSERT OR REPLACE INTO ${table} (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(sql).join(', ')});`;

const lines = [
  ...categories.map((c) => insert('categories', { id: c.id, parentId: c.parentId, slug: c.slug, nameEn: c.name.en, nameAr: c.name.ar, sortOrder: c.sortOrder })),
  ...colors.map((c) => insert('colors', { id: c.id, code: c.code, nameEn: c.name.en, nameAr: c.name.ar, hex: c.hex })),
  ...sizes.map((s) => insert('sizes', { id: s.id, label: s.label, sortOrder: s.sortOrder })),
  ...merchants.map((m) => insert('merchants', { id: m.id, slug: m.slug, name: m.name, bioEn: m.bio.en, bioAr: m.bio.ar, logoPath: m.logoPath, status: m.status, deliveryFeePiasters: m.deliveryFeePiasters })),
  ...products.map((p) => insert('products', { id: p.id, merchantId: p.merchantId, categoryId: p.categoryId, nameEn: p.name.en, nameAr: p.name.ar, descriptionEn: p.description.en, descriptionAr: p.description.ar, visualDescription: visual[p.id] ?? p.visualDescription, gender: p.gender, status: p.status, pricePiasters: p.pricePiasters, imagePath: p.images[0].path })),
  ...products.flatMap((p) => p.variants.map((v) => insert('product_variants', { id: v.id, productId: v.productId, colorId: v.colorId, sizeId: v.sizeId, pricePiasters: v.pricePiasters, stockQuantity: v.stockQuantity, isAvailable: v.isAvailable }))),
];
writeFileSync('apps/api/seed/seed.sql', `${lines.join('\n')}\n`);

const vectors = products.map((p) => ({
  id: p.id,
  text: `${p.name.en}. ${visual[p.id] ?? p.visualDescription}`,
  metadata: { pricePiasters: Math.min(p.pricePiasters, ...p.variants.map((v) => v.pricePiasters ?? p.pricePiasters)), categoryId: p.categoryId, colorCode: p.variants[0].colorId.replace('color-', '') },
}));
writeFileSync('apps/api/seed/vectors.json', JSON.stringify(vectors, null, 1));
console.log(`${lines.length} SQL rows, ${vectors.length} vectors, ${Object.keys(visual).length} photos read by Muse`);
