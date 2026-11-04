/** A flat drawing of each kind of clothing, in the product's real color. Real photos replace these later. */
const SHAPES: Readonly<Record<string, string>> = {
  jackets: 'M28 22 L40 16 L50 22 L60 16 L72 22 L88 40 L78 52 L72 46 L72 104 L28 104 L28 46 L22 52 L12 40 Z M50 22 L50 104',
  hoodies: 'M38 20 C38 8 62 8 62 20 L72 24 L88 44 L78 54 L72 48 L72 104 L28 104 L28 48 L22 54 L12 44 L28 24 Z M40 76 L60 76 L64 92 L36 92 Z',
  sweatshirts: 'M38 20 C44 26 56 26 62 20 L72 24 L88 44 L78 54 L72 48 L72 104 L28 104 L28 48 L22 54 L12 44 L28 24 Z',
  knitwear: 'M40 18 L60 18 L74 24 L90 56 L80 62 L72 50 L72 104 L28 104 L28 50 L20 62 L10 56 L26 24 Z',
  jeans: 'M30 16 L70 16 L76 110 L56 110 L50 48 L44 110 L24 110 Z',
  pants: 'M32 16 L68 16 L72 110 L55 110 L50 44 L45 110 L28 110 Z',
  dresses: 'M40 14 L46 24 L54 24 L60 14 L66 18 L62 46 L82 110 L18 110 L38 46 L34 18 Z',
  skirts: 'M34 34 L66 34 L84 102 L16 102 Z',
  shoes: 'M14 62 L40 58 L58 76 L88 82 C92 84 92 96 88 96 L14 96 Z',
  bags: 'M24 46 L76 46 L84 104 L16 104 Z M38 46 C38 22 62 22 62 46',
};

export function productArtUrl(categorySlug: string, hex: string): string {
  const shape = SHAPES[categorySlug] ?? SHAPES['sweatshirts'] ?? '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125"><rect width="100" height="125" fill="#EBDDBF"/><path d="${shape}" fill="${hex}" stroke="#1C1412" stroke-width="1" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
