import { useCallback, useState } from 'react';
import type { ListingAssistant, MerchantProductsRepository } from '../../../core/domain/ports';
import { photoProblem, type PhotoInput } from '../../../core/domain/vision';
import { fieldsFromDraft, formFromFields, listingProblems, type ListingFields, type ListingProblem } from '../domain/listing';

export type AddProductState =
  | { readonly kind: 'choosing'; readonly problem: 'photo' | 'read' | null }
  | { readonly kind: 'reading'; readonly photoUrl: string }
  | {
      readonly kind: 'reviewing';
      readonly photoUrl: string;
      readonly fields: ListingFields;
      readonly problems: readonly ListingProblem[];
      readonly saving: 'no' | 'draft' | 'publish';
      readonly hasFailed: boolean;
    }
  | { readonly kind: 'done'; readonly result: 'draft' | 'published' };

export function useMerchantAddProductViewModel(
  assistant: ListingAssistant,
  products: Pick<MerchantProductsRepository, 'saveDraft' | 'publish'>,
) {
  const [state, setState] = useState<AddProductState>({ kind: 'choosing', problem: null });

  const pick = useCallback(
    (file: Pick<File, 'name' | 'type' | 'size'>, photoUrl: string) => {
      const photo: PhotoInput = { name: file.name, type: file.type, sizeBytes: file.size, previewUrl: photoUrl };
      if (photoProblem(photo) !== null) {
        setState({ kind: 'choosing', problem: 'photo' });
        return;
      }
      setState({ kind: 'reading', photoUrl });
      assistant.readPhoto(photo).then(
        (draft) => setState({ kind: 'reviewing', photoUrl, fields: fieldsFromDraft(draft), problems: [], saving: 'no', hasFailed: false }),
        () => setState({ kind: 'choosing', problem: 'read' }),
      );
    },
    [assistant],
  );

  const edit = useCallback((change: Partial<ListingFields>) => {
    setState((current) => (current.kind === 'reviewing' ? { ...current, fields: { ...current.fields, ...change } } : current));
  }, []);

  const save = useCallback(
    (mode: 'draft' | 'publish') => {
      if (state.kind !== 'reviewing') {
        return;
      }
      const problems = listingProblems(state.fields);
      if (problems.length > 0) {
        setState({ ...state, problems, hasFailed: false });
        return;
      }
      setState({ ...state, problems: [], saving: mode, hasFailed: false });
      const form = formFromFields(state.fields, [state.photoUrl]);
      (mode === 'draft' ? products.saveDraft(form) : products.publish(form)).then(
        () => setState({ kind: 'done', result: mode === 'draft' ? 'draft' : 'published' }),
        () => setState({ ...state, problems: [], saving: 'no', hasFailed: true }),
      );
    },
    [state, products],
  );

  const reset = useCallback(() => setState({ kind: 'choosing', problem: null }), []);

  return { state, pick, edit, save, reset };
}
