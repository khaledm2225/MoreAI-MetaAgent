import { describe, expect, it } from 'vitest';
import { fieldsFromDraft, formFromFields, listingProblems, type ListingFields } from './listing';

const fields: ListingFields = {
  nameEn: 'Black jacket',
  nameAr: 'جاكيت أسود',
  descriptionEn: 'Warm',
  descriptionAr: 'دافي',
  visualDescription: 'black jacket',
  categoryId: 'c',
  colorCodes: ['black'],
  sizes: 'S, M،L',
  pounds: '450',
  stock: '3',
};

describe('listing rules', () => {
  it('accepts complete details', () => {
    expect(listingProblems(fields)).toEqual([]);
  });

  it('names what is wrong', () => {
    expect(listingProblems({ ...fields, nameAr: ' ', sizes: ',', pounds: '12.5', stock: 'many' })).toEqual(['nameAr', 'sizes', 'pounds', 'stock']);
  });

  it('refuses a free product', () => {
    expect(listingProblems({ ...fields, pounds: '0' })).toEqual(['pounds']);
  });

  it('turns pounds into exact piasters and reads both kinds of comma', () => {
    expect(formFromFields(fields, ['/a.png'])).toMatchObject({
      pricePiasters: 45_000,
      stockPerVariant: 3,
      sizeLabels: ['S', 'M', 'L'],
      imageUrls: ['/a.png'],
    });
  });

  it('falls back to the English when a translation is missing, so it can’t block a merchant', () => {
    const draft = { name: { en: 'A', ar: ' ' }, description: { en: 'B', ar: '' }, visualDescription: 'v', categoryId: 'c', colorCodes: ['black'], sizeLabels: ['S'], pricePiasters: null };
    expect(fieldsFromDraft(draft)).toMatchObject({ nameAr: 'A', descriptionAr: 'B' });
  });

  it('starts from what the AI read, leaving the price to the merchant', () => {
    const draft = { name: { en: 'A', ar: 'أ' }, description: { en: 'B', ar: 'ب' }, visualDescription: 'v', categoryId: 'c', colorCodes: ['black'], sizeLabels: ['S', 'M'], pricePiasters: null };
    expect(fieldsFromDraft(draft)).toMatchObject({ nameEn: 'A', sizes: 'S, M', pounds: '' });
  });
});
