import { useCallback, useState } from 'react';
import type { Merchant } from '../../../core/domain/catalog';
import type { MerchantProfileRepository } from '../../../core/domain/ports';
import { photoProblem } from '../../../core/domain/vision';

export interface JoinProblems {
  readonly name: boolean;
  readonly bio: boolean;
  readonly image: boolean;
}

export type JoinState =
  | { readonly kind: 'editing'; readonly problems: JoinProblems; readonly hasFailed: boolean }
  | { readonly kind: 'saving' }
  | { readonly kind: 'live'; readonly merchant: Merchant };

const noProblems: JoinProblems = { name: false, bio: false, image: false };

export function useMerchantJoinViewModel(profile: Pick<MerchantProfileRepository, 'join'>) {
  const [state, setState] = useState<JoinState>({ kind: 'editing', problems: noProblems, hasFailed: false });
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const pickImage = useCallback((file: Pick<File, 'type' | 'size'>, previewUrl: string) => {
    if (photoProblem({ type: file.type, sizeBytes: file.size }) !== null) {
      setImageUrl(null);
      setState({ kind: 'editing', problems: { ...noProblems, image: true }, hasFailed: false });
      return;
    }
    setImageUrl(previewUrl);
    setState({ kind: 'editing', problems: noProblems, hasFailed: false });
  }, []);

  const clearImage = useCallback(() => setImageUrl(null), []);

  const join = useCallback(
    (name: string, bio: string) => {
      const problems: JoinProblems = { name: name.trim() === '', bio: bio.trim() === '', image: false };
      if (problems.name || problems.bio) {
        setState({ kind: 'editing', problems, hasFailed: false });
        return;
      }
      setState({ kind: 'saving' });
      profile.join({ name: name.trim(), bio: bio.trim(), imageUrl }).then(
        (merchant) => setState({ kind: 'live', merchant }),
        () => setState({ kind: 'editing', problems: noProblems, hasFailed: true }),
      );
    },
    [profile, imageUrl],
  );

  return { state, imageUrl, pickImage, clearImage, join };
}
