import type { Id } from './catalog';
import type { LocalizedText } from './text';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'NOT_DELIVERED';

const moves: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  PLACED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'NOT_DELIVERED'],
  DELIVERED: [],
  REJECTED: [],
  CANCELLED: [],
  NOT_DELIVERED: [],
};

export const ORDER_LIMITS = { perShopperPerDay: 3, perBrandPerDay: 1 } as const;

/** A brand pays nothing until after its own first 100 orders. */
export const FREE_ORDERS_PER_BRAND = 100;

export interface Address {
  readonly recipientName: string;
  readonly mobile: string;
  readonly area: string;
  readonly street: string;
  readonly building: string;
  readonly floor: string;
  readonly apartment: string;
  readonly landmark: string;
  readonly notes: string;
}

export interface OrderItem {
  readonly id: Id;
  readonly productId: Id;
  readonly variantId: Id;
  readonly productName: LocalizedText;
  readonly colorName: LocalizedText;
  readonly sizeLabel: string;
  readonly imagePath: string | null;
  readonly unitPricePiasters: number;
  readonly quantity: number;
  readonly lineTotalPiasters: number;
}

export interface OrderRating {
  readonly stars: number;
  readonly comment: string;
}

/** One order with one brand. A cart across brands becomes one of these per brand. */
export interface Order {
  readonly id: Id;
  readonly orderNumber: string;
  readonly merchantId: Id;
  readonly merchantName: string;
  readonly status: OrderStatus;
  readonly items: readonly OrderItem[];
  readonly subtotalPiasters: number;
  readonly deliveryFeePiasters: number;
  readonly totalPiasters: number;
  readonly address: Address;
  readonly placedAt: Date;
  readonly rating: OrderRating | null;
}

export type PlaceOrderResult =
  | { readonly kind: 'placed'; readonly orders: readonly Order[] }
  | { readonly kind: 'dailyLimit'; readonly reason: OrderLimitReason; readonly merchantId?: Id }
  | { readonly kind: 'blocked'; readonly merchantId: Id }
  | { readonly kind: 'empty' }
  | { readonly kind: 'changed' };

export type OrderLimitReason = 'SHOPPER_DAILY_LIMIT' | 'BRAND_DAILY_LIMIT';

export type OrderLimitCheck =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: 'SHOPPER_DAILY_LIMIT' }
  | { readonly allowed: false; readonly reason: 'BRAND_DAILY_LIMIT'; readonly merchantId: Id };

export function canMoveOrder(from: OrderStatus, to: OrderStatus): boolean {
  return moves[from].includes(to);
}

export function nextOrderStatuses(from: OrderStatus): readonly OrderStatus[] {
  return moves[from];
}

export function isFinishedOrder(status: OrderStatus): boolean {
  return moves[status].length === 0;
}

export function canRateOrder(order: Pick<Order, 'status' | 'rating'>): boolean {
  return order.status === 'DELIVERED' && order.rating === null;
}

/** `placedToday` holds the brand of each order the shopper placed today. */
export function checkOrderLimits({
  placedToday,
  merchantIds,
}: {
  readonly placedToday: readonly Id[];
  readonly merchantIds: readonly Id[];
}): OrderLimitCheck {
  const repeated = merchantIds.find((merchantId) => placedToday.includes(merchantId));
  if (repeated !== undefined) {
    return { allowed: false, reason: 'BRAND_DAILY_LIMIT', merchantId: repeated };
  }
  if (placedToday.length + merchantIds.length > ORDER_LIMITS.perShopperPerDay) {
    return { allowed: false, reason: 'SHOPPER_DAILY_LIMIT' };
  }
  return { allowed: true };
}

export function freeOrdersLeft(ordersSoFar: number): number {
  return Math.max(0, FREE_ORDERS_PER_BRAND - ordersSoFar);
}

const EGYPTIAN_MOBILE = /^01[0125]\d{8}$/;

export function isValidEgyptianMobile(mobile: string): boolean {
  return EGYPTIAN_MOBILE.test(mobile);
}

export type AddressField = 'recipientName' | 'mobile' | 'area' | 'street' | 'building';

/** The fields that stop an order from being delivered. Floor, apartment and notes are optional. */
export function addressProblems(address: Address): readonly AddressField[] {
  const required: readonly AddressField[] = ['recipientName', 'mobile', 'area', 'street', 'building'];
  return required.filter((field) =>
    field === 'mobile' ? !isValidEgyptianMobile(address.mobile.trim()) : address[field].trim() === '',
  );
}
