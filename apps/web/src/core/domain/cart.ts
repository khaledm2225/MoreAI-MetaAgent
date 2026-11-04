import type { Id } from './catalog';
import type { LocalizedText } from './text';

export type CartLineAvailability = 'available' | 'soldOut';

export interface CartLine {
  readonly id: Id;
  readonly productId: Id;
  readonly variantId: Id;
  readonly merchantId: Id;
  readonly merchantName: string;
  readonly productName: LocalizedText;
  readonly colorName: LocalizedText;
  readonly sizeLabel: string;
  readonly imagePath: string | null;
  readonly unitPricePiasters: number;
  readonly quantity: number;
  readonly availability: CartLineAvailability;
  /** Set when the price changed since the piece was added, so the shopper is told. */
  readonly previousUnitPricePiasters: number | null;
}

export interface CartGroup {
  readonly merchantId: Id;
  readonly merchantName: string;
  readonly lines: readonly CartLine[];
}

export function lineTotalPiasters(line: Pick<CartLine, 'unitPricePiasters' | 'quantity'>): number {
  return line.unitPricePiasters * line.quantity;
}

export function cartTotalPiasters(lines: readonly CartLine[]): number {
  return lines
    .filter(({ availability }) => availability === 'available')
    .reduce((total, line) => total + lineTotalPiasters(line), 0);
}

export function groupCartByMerchant(lines: readonly CartLine[]): readonly CartGroup[] {
  const groups = new Map<Id, CartLine[]>();
  for (const line of lines) {
    groups.set(line.merchantId, [...(groups.get(line.merchantId) ?? []), line]);
  }
  return [...groups.entries()].map(([merchantId, merchantLines]) => ({
    merchantId,
    merchantName: merchantLines[0]?.merchantName ?? '',
    lines: merchantLines,
  }));
}
