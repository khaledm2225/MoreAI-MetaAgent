import type { LocalizedText } from './text';

export type Id = string;
export type Gender = 'MEN' | 'WOMEN' | 'UNISEX';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
export type MerchantStatus = 'PENDING' | 'LIVE' | 'SUSPENDED' | 'CLOSED';

export interface Merchant {
  readonly id: Id;
  readonly slug: string;
  readonly name: string;
  readonly bio: LocalizedText;
  readonly logoPath: string | null;
  readonly status: MerchantStatus;
  readonly deliveryFeePiasters: number;
}

export interface Category {
  readonly id: Id;
  readonly parentId: Id | null;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly sortOrder: number;
}

export interface Color {
  readonly id: Id;
  readonly code: string;
  readonly name: LocalizedText;
  readonly hex: string;
}

export interface Size {
  readonly id: Id;
  readonly label: string;
  readonly sortOrder: number;
}

export interface ProductImage {
  readonly id: Id;
  readonly path: string;
  readonly alt: LocalizedText;
  readonly position: number;
}

/** One color and size that can be bought. Carts and orders point at this. */
export interface ProductVariant {
  readonly id: Id;
  readonly productId: Id;
  readonly colorId: Id;
  readonly sizeId: Id;
  /** Only when this variant costs more or less than the product. */
  readonly pricePiasters: number | null;
  readonly stockQuantity: number;
  readonly isAvailable: boolean;
}

export interface Product {
  readonly id: Id;
  readonly merchantId: Id;
  readonly categoryId: Id;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  /** What the AI read from the photo: color, style, fit and vibe. Search matches against it. */
  readonly visualDescription: string;
  readonly gender: Gender;
  readonly status: ProductStatus;
  readonly pricePiasters: number;
  readonly images: readonly ProductImage[];
  readonly variants: readonly ProductVariant[];
}
