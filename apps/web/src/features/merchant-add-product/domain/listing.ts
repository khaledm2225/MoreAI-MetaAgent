import type { Id } from '../../../core/domain/catalog';
import type { ListingDraft, ProductForm } from '../../../core/domain/merchant';

const PIASTERS_PER_POUND = 100;

/** The form as the merchant edits it: free text until it's checked. */
export interface ListingFields {
  readonly nameEn: string;
  readonly nameAr: string;
  readonly descriptionEn: string;
  readonly descriptionAr: string;
  readonly visualDescription: string;
  readonly categoryId: Id;
  readonly colorCodes: readonly string[];
  readonly sizes: string;
  readonly pounds: string;
  readonly stock: string;
}

export type ListingProblem = 'nameEn' | 'nameAr' | 'descriptionEn' | 'descriptionAr' | 'sizes' | 'pounds' | 'stock';

export function fieldsFromDraft(draft: ListingDraft): ListingFields {
  return {
    nameEn: draft.name.en,
    // A missing translation can't block a merchant, so it falls back to the English.
    nameAr: draft.name.ar.trim() === '' ? draft.name.en : draft.name.ar,
    descriptionEn: draft.description.en,
    descriptionAr: draft.description.ar.trim() === '' ? draft.description.en : draft.description.ar,
    visualDescription: draft.visualDescription,
    categoryId: draft.categoryId,
    colorCodes: draft.colorCodes,
    sizes: draft.sizeLabels.join(', '),
    pounds: draft.pricePiasters === null ? '' : String(draft.pricePiasters / PIASTERS_PER_POUND),
    stock: '5',
  };
}

function sizesOf(text: string): readonly string[] {
  return text
    .split(/[,،]/)
    .map((size) => size.trim())
    .filter((size) => size !== '');
}

export function listingProblems(fields: ListingFields): readonly ListingProblem[] {
  const problems: ListingProblem[] = [];
  for (const name of ['nameEn', 'nameAr', 'descriptionEn', 'descriptionAr'] as const) {
    if (fields[name].trim() === '') {
      problems.push(name);
    }
  }
  if (sizesOf(fields.sizes).length === 0) {
    problems.push('sizes');
  }
  if (!/^\d+$/.test(fields.pounds.trim()) || Number(fields.pounds) <= 0) {
    problems.push('pounds');
  }
  if (!/^\d+$/.test(fields.stock.trim())) {
    problems.push('stock');
  }
  return problems;
}

export function formFromFields(fields: ListingFields, imageUrls: readonly string[]): ProductForm {
  return {
    name: { en: fields.nameEn.trim(), ar: fields.nameAr.trim() },
    description: { en: fields.descriptionEn.trim(), ar: fields.descriptionAr.trim() },
    visualDescription: fields.visualDescription.trim(),
    categoryId: fields.categoryId,
    colorCodes: fields.colorCodes,
    sizeLabels: sizesOf(fields.sizes),
    pricePiasters: Number(fields.pounds.trim()) * PIASTERS_PER_POUND,
    stockPerVariant: Number(fields.stock.trim()),
    imageUrls,
  };
}
