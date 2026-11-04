export interface ShopperRequest {
  readonly categorySlug?: string;
  readonly colorCode?: string;
  readonly styleWord?: string;
  readonly maxPricePiasters?: number;
  readonly wantsCheckout: boolean;
}

const CATEGORY_WORDS: Readonly<Record<string, readonly string[]>> = {
  jackets: ['jacket', 'coat', 'جاكيت', 'جاكت', 'جواكت'],
  hoodies: ['hoodie', 'هودي'],
  sweatshirts: ['sweatshirt', 'سويت'],
  knitwear: ['sweater', 'knit', 'بلوفر', 'تريكو'],
  jeans: ['jeans', 'denim', 'جينز'],
  pants: ['pants', 'trousers', 'بنطلون'],
  dresses: ['dress', 'فستان'],
  skirts: ['skirt', 'جيبة'],
  shoes: ['sneakers', 'shoes', 'كوتشي', 'جزمة'],
  bags: ['bag', 'شنطة'],
};

const COLOR_WORDS: Readonly<Record<string, readonly string[]>> = {
  black: ['black', 'أسود', 'اسود', 'سودا'],
  beige: ['beige', 'بيج'],
  navy: ['navy', 'كحلي'],
  olive: ['olive', 'زيتي'],
  burgundy: ['burgundy', 'نبيتي'],
  grey: ['grey', 'gray', 'رصاصي'],
  brown: ['brown', 'بني'],
  cream: ['cream', 'كريمي'],
};

const STYLE_WORDS: Readonly<Record<string, readonly string[]>> = {
  oversized: ['oversized', 'واسع', 'واسعة'],
  classic: ['classic', 'كلاسيك'],
  cropped: ['cropped', 'قصير', 'قصيرة'],
  cozy: ['cozy', 'دافي', 'دافية'],
};

const CHECKOUT_WORDS: readonly string[] = ['checkout', 'check out', 'place the order', 'اطلب', 'أطلب'];
const PIASTERS = 100;
/** Below this, a number is a clothing size, not a budget in pounds. */
const SMALLEST_BUDGET_POUNDS = 50;

function firstMatch(text: string, table: Readonly<Record<string, readonly string[]>>): string | undefined {
  return Object.entries(table).find(([, words]) => words.some((word) => text.includes(word)))?.[0];
}

function latinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - '٠'.charCodeAt(0)));
}

function readBudget(text: string): number | undefined {
  const numbers = [...latinDigits(text).replaceAll(/(\d),(\d{3})/g, '$1$2').matchAll(/\d+/g)].map((match) => Number(match[0]));
  const budget = numbers.find((value) => value >= SMALLEST_BUDGET_POUNDS);
  return budget === undefined ? undefined : budget * PIASTERS;
}

/**
 * The demo's stand in for the model's understanding. In Phase 2, Muse does this
 * through a tool call, and the price is still checked in code.
 */
export function readShopperRequest(rawText: string): ShopperRequest {
  const text = rawText.toLowerCase();
  const categorySlug = firstMatch(text, CATEGORY_WORDS);
  const colorCode = firstMatch(text, COLOR_WORDS);
  const styleWord = firstMatch(text, STYLE_WORDS);
  const maxPricePiasters = readBudget(text);
  return {
    ...(categorySlug === undefined ? {} : { categorySlug }),
    ...(colorCode === undefined ? {} : { colorCode }),
    ...(styleWord === undefined ? {} : { styleWord }),
    ...(maxPricePiasters === undefined ? {} : { maxPricePiasters }),
    wantsCheckout: CHECKOUT_WORDS.some((word) => text.includes(word)),
  };
}
