import type { Merchant } from '../../domain/catalog';
import type { ListingDraft } from '../../domain/merchant';
import type { ListingAssistant, PhotoToShopGateway, ProductSearch } from '../../domain/ports';
import type { DetectedPiece, PhotoInput, PieceBox, SimilarPiece } from '../../domain/vision';
import type { ApiClient } from './api';
import { firstBoxOf, outputTextOf } from './metaResponse';

const SIMILAR_PIECES = 4;
const WHOLE_PHOTO: PieceBox = { left: 0, top: 0, right: 1, bottom: 1 };

const DEFAULT_SIZES: Readonly<Record<string, readonly string[]>> = {
  jeans: ['30', '32', '34', '36'],
  pants: ['30', '32', '34', '36'],
  shoes: ['40', '41', '42', '43', '44'],
  bags: ['One size'],
};

interface ListingAnswer {
  readonly nameEn: string;
  readonly nameAr: string;
  readonly descriptionEn: string;
  readonly descriptionAr: string;
  readonly visualDescription: string;
  readonly categorySlug: string;
  readonly colorCode: string;
}

interface PiecesAnswer {
  readonly pieces: readonly { readonly concept: string; readonly labelEn: string; readonly labelAr: string; readonly description: string }[];
}

type ToDataUrl = (previewUrl: string) => Promise<string>;

/** Muse Spark reads the photo, and the merchant still reviews everything before it goes live. */
export function createRemoteListingAssistant(api: Pick<ApiClient, 'readProductPhoto'>, toDataUrl: ToDataUrl): ListingAssistant {
  return {
    readPhoto: async (photo: PhotoInput): Promise<ListingDraft> => {
      const answer = JSON.parse(outputTextOf(await api.readProductPhoto(await toDataUrl(photo.previewUrl)))) as ListingAnswer;
      return {
        name: { en: answer.nameEn, ar: answer.nameAr },
        description: { en: answer.descriptionEn, ar: answer.descriptionAr },
        visualDescription: answer.visualDescription,
        categoryId: `category-${answer.categorySlug}`,
        colorCodes: [answer.colorCode],
        sizeLabels: DEFAULT_SIZES[answer.categorySlug] ?? ['S', 'M', 'L', 'XL'],
        pricePiasters: null,
      };
    },
  };
}

export interface RemotePhotoToShopPorts {
  readonly api: Pick<ApiClient, 'detectPieces' | 'segment'>;
  readonly search: ProductSearch;
  readonly merchantById: (id: string) => Merchant | undefined;
  readonly toDataUrl: ToDataUrl;
}

/** Muse Spark names each piece, SAM 3.1 finds where it is, then the search finds similar ones. */
export function createRemotePhotoToShop({ api, search, merchantById, toDataUrl }: RemotePhotoToShopPorts): PhotoToShopGateway {
  return {
    detectPieces: async (photo: PhotoInput): Promise<readonly DetectedPiece[]> => {
      const image = await toDataUrl(photo.previewUrl);
      const { pieces } = JSON.parse(outputTextOf(await api.detectPieces(image))) as PiecesAnswer;
      return Promise.all(
        pieces.map(async (piece, index) => ({
          id: `piece-${String(index + 1)}`,
          label: { en: piece.labelEn, ar: piece.labelAr },
          box: firstBoxOf(outputTextOf(await api.segment(image, piece.concept))) ?? WHOLE_PHOTO,
          description: piece.description,
        })),
      );
    },
    findSimilar: async (piece: DetectedPiece): Promise<readonly SimilarPiece[]> => {
      const products = await search.search({ text: piece.description, limit: SIMILAR_PIECES });
      return products.flatMap((product) => {
        const merchant = merchantById(product.merchantId);
        return merchant === undefined
          ? []
          : [{ product, merchant, reason: { en: `Similar to the ${piece.label.en.toLowerCase()} in your photo.`, ar: `شبه ال${piece.label.ar} اللي في صورتك.` } }];
      });
    },
  };
}
