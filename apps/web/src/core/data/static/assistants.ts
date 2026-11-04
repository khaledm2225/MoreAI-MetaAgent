import type { PhotoToShopGateway, ListingAssistant, ProductSearch } from '../../domain/ports';
import type { DetectedPiece, PhotoInput, SimilarPiece } from '../../domain/vision';
import { demoCategories } from './demoCatalog';
import type { DemoWorld } from './demoWorld';

const SIMILAR_PIECES = 4;

export function createStaticPhotoToShop(world: DemoWorld, search: ProductSearch): PhotoToShopGateway {
  return {
    detectPieces: async (photo: PhotoInput): Promise<readonly DetectedPiece[]> => {
      await world.wait();
      if (photo.name.toLowerCase().includes('nothing')) {
        return [];
      }
      return [
        {
          id: 'piece-jacket',
          label: { en: 'Jacket', ar: 'جاكيت' },
          box: { left: 0.22, top: 0.14, right: 0.78, bottom: 0.56 },
          description: 'black jacket',
        },
        {
          id: 'piece-jeans',
          label: { en: 'Jeans', ar: 'جينز' },
          box: { left: 0.28, top: 0.56, right: 0.72, bottom: 0.92 },
          description: 'navy jeans',
        },
      ];
    },
    findSimilar: async (piece: DetectedPiece): Promise<readonly SimilarPiece[]> => {
      const products = await search.search({ text: piece.description, limit: SIMILAR_PIECES });
      return products.flatMap((product) => {
        const merchant = world.merchantById(product.merchantId);
        return merchant === undefined
          ? []
          : [{ product, merchant, reason: { en: `Similar to the ${piece.label.en.toLowerCase()} in your photo.`, ar: `شبه ال${piece.label.ar} اللي في صورتك.` } }];
      });
    },
  };
}

export function createStaticListingAssistant(world: DemoWorld): ListingAssistant {
  return {
    readPhoto: async () => {
      await world.wait();
      return {
        name: { en: 'Black oversized jacket', ar: 'جاكيت أسود واسع' },
        description: {
          en: 'A relaxed black jacket that goes with any outfit.',
          ar: 'جاكيت أسود واسع وهادي، ينفع مع أي Outfit.',
        },
        visualDescription: 'black jacket, oversized, relaxed street look',
        categoryId: demoCategories[0]?.id ?? '',
        colorCodes: ['black'],
        sizeLabels: ['S', 'M', 'L'],
        pricePiasters: null,
      };
    },
  };
}
