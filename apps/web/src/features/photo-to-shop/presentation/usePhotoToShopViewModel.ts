import { useCallback, useRef, useState } from 'react';
import type { PhotoToShopGateway } from '../../../core/domain/ports';
import { photoProblem, type DetectedPiece, type PhotoInput, type PhotoProblem, type SimilarPiece } from '../../../core/domain/vision';

export type PhotoToShopState =
  | { readonly kind: 'choosing'; readonly problem: PhotoProblem | null }
  | { readonly kind: 'outlining'; readonly photoUrl: string }
  | { readonly kind: 'failed' }
  | { readonly kind: 'noPieces'; readonly photoUrl: string }
  | {
      readonly kind: 'pieces';
      readonly photoUrl: string;
      readonly pieces: readonly DetectedPiece[];
      readonly selectedId: string | null;
      readonly similar: 'idle' | 'loading' | 'failed' | readonly SimilarPiece[];
    };

export function usePhotoToShopViewModel(gateway: PhotoToShopGateway) {
  const [state, setState] = useState<PhotoToShopState>({ kind: 'choosing', problem: null });
  const latest = useRef(0);

  const selectPiece = useCallback(
    (piece: DetectedPiece) => {
      latest.current += 1;
      const request = latest.current;
      const update = (similar: 'loading' | 'failed' | readonly SimilarPiece[]) =>
        setState((current) => (current.kind === 'pieces' && request === latest.current ? { ...current, selectedId: piece.id, similar } : current));
      update('loading');
      gateway.findSimilar(piece).then(update, () => update('failed'));
    },
    [gateway],
  );

  const pick = useCallback(
    (file: Pick<File, 'name' | 'type' | 'size'>, previewUrl: string) => {
      const photo: PhotoInput = { name: file.name, type: file.type, sizeBytes: file.size, previewUrl };
      const problem = photoProblem(photo);
      if (problem !== null) {
        setState({ kind: 'choosing', problem });
        return;
      }
      latest.current += 1;
      const request = latest.current;
      setState({ kind: 'outlining', photoUrl: previewUrl });
      gateway.detectPieces(photo).then(
        (pieces) => {
          if (request === latest.current) {
            setState(
              pieces.length === 0
                ? { kind: 'noPieces', photoUrl: previewUrl }
                : { kind: 'pieces', photoUrl: previewUrl, pieces, selectedId: null, similar: 'idle' },
            );
            // Nobody should have to work out that a box can be tapped: the first piece's matches come right away.
            const first = pieces[0];
            if (first !== undefined) {
              selectPiece(first);
            }
          }
        },
        () => {
          if (request === latest.current) {
            setState({ kind: 'failed' });
          }
        },
      );
    },
    [gateway, selectPiece],
  );

  const reset = useCallback(() => {
    latest.current += 1;
    setState({ kind: 'choosing', problem: null });
  }, []);

  return { state, pick, selectPiece, reset };
}
