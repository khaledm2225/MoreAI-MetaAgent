import type { Category, Color, Gender, Merchant, Product, ProductVariant, Size } from '../../domain/catalog';

type ArabicGender = 'm' | 'f';

interface CategorySeed {
  readonly slug: string;
  readonly en: string;
  readonly ar: string;
  readonly gender: ArabicGender;
  readonly basePounds: number;
  readonly sizes: readonly string[];
  readonly wearer: Gender;
}

const CATEGORY_SEEDS: readonly CategorySeed[] = [
  { slug: 'jackets', en: 'jacket', ar: 'جاكيت', gender: 'm', basePounds: 900, sizes: ['S', 'M', 'L', 'XL'], wearer: 'UNISEX' },
  { slug: 'hoodies', en: 'hoodie', ar: 'هودي', gender: 'm', basePounds: 650, sizes: ['S', 'M', 'L', 'XL'], wearer: 'UNISEX' },
  { slug: 'sweatshirts', en: 'sweatshirt', ar: 'سويت شيرت', gender: 'm', basePounds: 550, sizes: ['S', 'M', 'L', 'XL'], wearer: 'UNISEX' },
  { slug: 'knitwear', en: 'sweater', ar: 'بلوفر', gender: 'm', basePounds: 700, sizes: ['S', 'M', 'L'], wearer: 'UNISEX' },
  { slug: 'jeans', en: 'jeans', ar: 'جينز', gender: 'm', basePounds: 800, sizes: ['30', '32', '34', '36'], wearer: 'UNISEX' },
  { slug: 'pants', en: 'pants', ar: 'بنطلون', gender: 'm', basePounds: 600, sizes: ['30', '32', '34', '36'], wearer: 'MEN' },
  { slug: 'dresses', en: 'dress', ar: 'فستان', gender: 'm', basePounds: 950, sizes: ['S', 'M', 'L'], wearer: 'WOMEN' },
  { slug: 'skirts', en: 'skirt', ar: 'جيبة', gender: 'f', basePounds: 500, sizes: ['S', 'M', 'L'], wearer: 'WOMEN' },
  { slug: 'shoes', en: 'sneakers', ar: 'كوتشي', gender: 'm', basePounds: 1100, sizes: ['40', '41', '42', '43', '44'], wearer: 'UNISEX' },
  { slug: 'bags', en: 'bag', ar: 'شنطة', gender: 'f', basePounds: 450, sizes: ['One size'], wearer: 'WOMEN' },
];

interface ColorSeed {
  readonly code: string;
  readonly en: string;
  readonly m: string;
  readonly f: string;
  readonly hex: string;
}

const COLOR_SEEDS: readonly ColorSeed[] = [
  { code: 'black', en: 'Black', m: 'أسود', f: 'سودا', hex: '#26201E' },
  { code: 'beige', en: 'Beige', m: 'بيج', f: 'بيج', hex: '#D9C49E' },
  { code: 'navy', en: 'Navy', m: 'كحلي', f: 'كحلي', hex: '#26324F' },
  { code: 'olive', en: 'Olive', m: 'زيتي', f: 'زيتي', hex: '#5F6237' },
  { code: 'burgundy', en: 'Burgundy', m: 'نبيتي', f: 'نبيتي', hex: '#6D1F2C' },
  { code: 'grey', en: 'Grey', m: 'رصاصي', f: 'رصاصي', hex: '#8A8782' },
  { code: 'brown', en: 'Brown', m: 'بني', f: 'بني', hex: '#6A4A36' },
  { code: 'cream', en: 'Cream', m: 'كريمي', f: 'كريمي', hex: '#F2E8D2' },
];

const STYLE_SEEDS = [
  { en: 'oversized', vibe: 'relaxed street look', m: 'واسع', f: 'واسعة' },
  { en: 'classic', vibe: 'calm everyday look', m: 'كلاسيك', f: 'كلاسيك' },
  { en: 'cropped', vibe: 'modern short cut', m: 'قصير', f: 'قصيرة' },
  { en: 'cozy', vibe: 'soft winter feel', m: 'دافي', f: 'دافية' },
] as const;

const BRANDS: readonly { readonly name: string; readonly en: string; readonly ar: string }[] = [
  { name: 'Sawa Studio', en: 'Easy pieces for every day, made for Cairo’s winter.', ar: 'قطع سهلة لكل يوم، معمولة لشتا القاهرة.' },
  { name: 'Noon Label', en: 'Clean cuts and calm colors.', ar: 'قصات نضيفة وألوان هادية.' },
  { name: 'Tayara Club', en: 'Loud street style with big fits.', ar: 'ستايل شارع واضح بمقاسات واسعة.' },
  { name: 'Mesk', en: 'Soft fabrics that feel good all day.', ar: 'قماش طري مريح طول اليوم.' },
  { name: 'Zeina Atelier', en: 'Elegant pieces for your big nights out.', ar: 'قطع شيك لخروجاتك الكبيرة.' },
  { name: 'Dawar', en: 'Simple staples you wear on repeat.', ar: 'أساسيات بسيطة هتلبسها كل شوية.' },
  { name: 'Sekka Supply', en: 'Street basics, made to last.', ar: 'أساسيات شارع بتعيش معاك.' },
  { name: 'Rawsha', en: 'Bright ideas for your everyday Outfit.', ar: 'أفكار حلوة لل Outfit بتاع كل يوم.' },
  { name: 'Hara Goods', en: 'Small drops, made in small batches.', ar: 'Drops صغيرة بكميات قليلة.' },
  { name: 'Layla Lane', en: 'Soft looks with a modern touch.', ar: 'لوكات ناعمة بلمسة مودرن.' },
  { name: 'Fekra', en: 'Graphic pieces with something to say.', ar: 'قطع بطباعات ليها معنى.' },
  { name: 'Ahwa Club', en: 'Laid back pieces for long nights with friends.', ar: 'قطع رايقة لقعدات الصحاب.' },
  { name: 'Qamar Studio', en: 'Night colors and sharp layers.', ar: 'ألوان الليل وطبقات شيك.' },
  { name: 'Naseem', en: 'Light layers for changing weather.', ar: 'طبقات خفيفة لكل جو.' },
  { name: 'Kalam', en: 'Bold words on easy fits.', ar: 'كلام جريء على قصات مريحة.' },
  { name: 'Sabah', en: 'Fresh basics for your morning.', ar: 'أساسيات فريش لصباحك.' },
  { name: 'Mazag Studio', en: 'Pieces that follow your mood.', ar: 'قطع ماشية مع مزاجك.' },
  { name: 'Kobry', en: 'Downtown energy, in every piece.', ar: 'روح وسط البلد في كل قطعة.' },
  { name: 'Rehla', en: 'Easy to pack, easy to wear.', ar: 'سهلة في الشنطة، سهلة في اللبس.' },
  { name: 'Khatwa', en: 'Comfort that keeps up with your steps.', ar: 'راحة ماشية مع خطواتك.' },
];

export const PRODUCTS_PER_MERCHANT = 10;
const PIASTERS = 100;

export const demoCategories: readonly Category[] = CATEGORY_SEEDS.map((seed, index) => ({
  id: `category-${seed.slug}`,
  parentId: null,
  slug: seed.slug,
  name: { en: `${seed.en[0]?.toUpperCase() ?? ''}${seed.en.slice(1)}`, ar: seed.ar },
  sortOrder: index,
}));

export const demoColors: readonly Color[] = COLOR_SEEDS.map((seed) => ({
  id: `color-${seed.code}`,
  code: seed.code,
  name: { en: seed.en, ar: seed.m },
  hex: seed.hex,
}));

const allSizeLabels = [...new Set(CATEGORY_SEEDS.flatMap(({ sizes }) => sizes))];
export const demoSizes: readonly Size[] = allSizeLabels.map((label, index) => ({
  id: `size-${label.replace(' ', '-').toLowerCase()}`,
  label,
  sortOrder: index,
}));

export const demoMerchants: readonly Merchant[] = BRANDS.map(({ name, en, ar }, index) => ({
  id: `merchant-${String(index + 1)}`,
  slug: name.toLowerCase().replaceAll(' ', '-'),
  name,
  bio: { en, ar },
  logoPath: null,
  status: 'LIVE',
  deliveryFeePiasters: 5_000,
}));

interface ProductPlan {
  readonly category: CategorySeed;
  readonly color: ColorSeed;
  readonly style: (typeof STYLE_SEEDS)[number];
  readonly pricePiasters: number;
}

/** Fixed pieces, so "a black jacket under 500 EGP" always has a clear right and wrong answer. */
function fixedPlan(merchantIndex: number, productIndex: number): Partial<ProductPlan> | null {
  if (productIndex !== 0 || merchantIndex > 3) {
    return null;
  }
  const prices = [100_000, 45_000, 39_900, 48_500];
  const jackets = CATEGORY_SEEDS[0];
  const black = COLOR_SEEDS[0];
  const price = prices[merchantIndex];
  if (jackets === undefined || black === undefined || price === undefined) {
    return null;
  }
  return { category: jackets, color: black, pricePiasters: price };
}

function pick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length];
  if (item === undefined) {
    throw new Error('The demo catalog has an empty list.');
  }
  return item;
}

function buildProduct(merchantIndex: number, productIndex: number): Product {
  const fixed = fixedPlan(merchantIndex, productIndex);
  const category = fixed?.category ?? pick(CATEGORY_SEEDS, merchantIndex + productIndex);
  const color = fixed?.color ?? pick(COLOR_SEEDS, merchantIndex * 3 + productIndex);
  const style = pick(STYLE_SEEDS, merchantIndex + productIndex * 2);
  const stepPounds = ((merchantIndex * 7 + productIndex * 11) % 9) * 50 - 200;
  const pricePiasters = fixed?.pricePiasters ?? (category.basePounds + stepPounds) * PIASTERS;

  const id = `product-${String(merchantIndex + 1)}-${String(productIndex + 1)}`;
  const merchant = pick(demoMerchants, merchantIndex);
  const colorAr = category.gender === 'm' ? color.m : color.f;
  const styleAr = category.gender === 'm' ? style.m : style.f;
  const nameEn = `${color.en} ${style.en} ${category.en}`;
  const nameAr = `${category.ar} ${colorAr} ${styleAr}`;
  const allSoldOut = (merchantIndex + productIndex) % 23 === 22;

  const variants: ProductVariant[] = category.sizes.map((label, sizeIndex) => ({
    id: `${id}-${label.replace(' ', '-').toLowerCase()}`,
    productId: id,
    colorId: `color-${color.code}`,
    sizeId: `size-${label.replace(' ', '-').toLowerCase()}`,
    pricePiasters: null,
    stockQuantity: allSoldOut || (merchantIndex + productIndex + sizeIndex) % 6 === 5 ? 0 : 4 + sizeIndex,
    isAvailable: true,
  }));

  return {
    id,
    merchantId: merchant.id,
    categoryId: `category-${category.slug}`,
    name: { en: nameEn, ar: nameAr },
    description: {
      en: `A ${style.en} ${category.en} in ${color.en.toLowerCase()}, with a ${style.vibe}.`,
      ar: `${nameAr}، من ${merchant.name}، معمول لأيام الشتا.`,
    },
    visualDescription: `${color.en.toLowerCase()} ${category.en}, ${style.en}, ${style.vibe}`,
    gender: category.wearer,
    status: 'ACTIVE',
    pricePiasters,
    images: [
      {
        id: `${id}-image`,
        path: `/products/${id}.jpg`,
        alt: { en: nameEn, ar: nameAr },
        position: 0,
      },
    ],
    variants,
  };
}

export function buildDemoProducts(): readonly Product[] {
  return demoMerchants.flatMap((_, merchantIndex) =>
    Array.from({ length: PRODUCTS_PER_MERCHANT }, (__, productIndex) => buildProduct(merchantIndex, productIndex)),
  );
}
