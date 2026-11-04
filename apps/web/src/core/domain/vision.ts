import type { Id } from './catalog';
import type { SuggestedPiece } from './agent';
import type { LocalizedText } from './text';

/** A photo a person chose, before any upload. */
export interface PhotoInput {
  readonly name: string;
  readonly type: string;
  readonly sizeBytes: number;
  /** A URL the page can show, such as an object URL. */
  readonly previewUrl: string;
}

/** The app's own limit, well under what the model accepts. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

export type PhotoProblem = 'wrongType' | 'tooLarge';

export function photoProblem(photo: Pick<PhotoInput, 'type' | 'sizeBytes'>): PhotoProblem | null {
  if (!PHOTO_TYPES.includes(photo.type)) {
    return 'wrongType';
  }
  return photo.sizeBytes > MAX_PHOTO_BYTES ? 'tooLarge' : null;
}

/** Where a piece sits in the photo, as fractions of its size, from 0 to 1. */
export interface PieceBox {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface DetectedPiece {
  readonly id: Id;
  readonly label: LocalizedText;
  readonly box: PieceBox;
  /** What the AI read from the piece, used to find similar ones. */
  readonly description: string;
}

export type SimilarPiece = SuggestedPiece;
