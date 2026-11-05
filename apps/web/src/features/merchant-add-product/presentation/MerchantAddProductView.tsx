import { Banner, Button, ButtonStack, Card, Grid, Media, PhotoPicker, Spinner, Stack, Text, TextField } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { isEnglishOnly } from '../../../core/presentation/languageMode';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { ListingFields, ListingProblem } from '../domain/listing';
import { strings } from './strings';
import type { AddProductState } from './useMerchantAddProductViewModel';

export interface MerchantAddProductViewProps {
  readonly state: AddProductState;
  readonly onPick: (file: File) => void;
  readonly onEdit: (change: Partial<ListingFields>) => void;
  readonly onSave: (mode: 'draft' | 'publish') => void;
  readonly onReset: () => void;
  readonly onSeeProducts: () => void;
}

export function MerchantAddProductView({ state, onPick, onEdit, onSave, onReset, onSeeProducts }: MerchantAddProductViewProps) {
  const t = useTranslations(strings);

  function errorFor(problems: readonly ListingProblem[], name: ListingProblem, message: string) {
    return problems.includes(name) ? { error: message } : {};
  }

  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')} width="wide">
      {state.kind === 'choosing' && (
        <Stack gap="s">
          {state.problem === 'photo' && <Banner tone="error">{t('wrongPhoto')}</Banner>}
          {state.problem === 'read' && <Banner tone="error">{t('readFailed')}</Banner>}
          <PhotoPicker label={t('choose')} hint={t('hint')} onPick={onPick} />
        </Stack>
      )}
      {state.kind === 'reading' && (
        <Stack gap="s">
          <Media src={state.photoUrl} alt={t('photoAlt')} ratio="landscape" priority />
          <Spinner label={t('reading')} />
          <Text tone="secondary">{t('reading')}</Text>
        </Stack>
      )}
      {state.kind === 'reviewing' && (
        <Grid itemWidth="wide" gap="l">
          <Media src={state.photoUrl} alt={t('photoAlt')} priority />
          <Card as="form" onSubmit={(event) => event.preventDefault()}>
            <Stack gap="s">
              <Banner>{t('reviewNote')}</Banner>
              <TextField label={t('nameEn')} value={state.fields.nameEn} onChange={(event) => onEdit({ nameEn: event.target.value })} {...errorFor(state.problems, 'nameEn', t('required'))} />
              {!isEnglishOnly && <TextField label={t('nameAr')} value={state.fields.nameAr} onChange={(event) => onEdit({ nameAr: event.target.value })} {...errorFor(state.problems, 'nameAr', t('required'))} />}
              <TextField label={t('descriptionEn')} multiline value={state.fields.descriptionEn} onChange={(event) => onEdit({ descriptionEn: event.target.value })} {...errorFor(state.problems, 'descriptionEn', t('required'))} />
              {!isEnglishOnly && <TextField label={t('descriptionAr')} multiline value={state.fields.descriptionAr} onChange={(event) => onEdit({ descriptionAr: event.target.value })} {...errorFor(state.problems, 'descriptionAr', t('required'))} />}
              <TextField label={t('aiRead')} value={state.fields.visualDescription} onChange={(event) => onEdit({ visualDescription: event.target.value })} />
              <TextField label={t('price')} inputMode="numeric" value={state.fields.pounds} onChange={(event) => onEdit({ pounds: event.target.value })} {...errorFor(state.problems, 'pounds', t('priceError'))} />
              <TextField label={t('sizes')} value={state.fields.sizes} onChange={(event) => onEdit({ sizes: event.target.value })} {...errorFor(state.problems, 'sizes', t('sizesError'))} />
              <TextField label={t('stock')} inputMode="numeric" value={state.fields.stock} onChange={(event) => onEdit({ stock: event.target.value })} {...errorFor(state.problems, 'stock', t('stockError'))} />
              {state.hasFailed && <Banner tone="error">{t('saveFailed')}</Banner>}
              <ButtonStack>
                <Button prominence="secondary" isLoading={state.saving === 'draft'} disabled={state.saving === 'publish'} onClick={() => onSave('draft')}>
                  {t('saveDraft')}
                </Button>
                <Button icon="check" isLoading={state.saving === 'publish'} disabled={state.saving === 'draft'} onClick={() => onSave('publish')}>
                  {t('publish')}
                </Button>
              </ButtonStack>
            </Stack>
          </Card>
        </Grid>
      )}
      {state.kind === 'done' && (
        <Stack gap="s">
          <Banner tone="success">{state.result === 'published' ? t('published') : t('draftSaved')}</Banner>
          <ButtonStack>
            <Button prominence="secondary" onClick={onSeeProducts}>
              {t('seeProducts')}
            </Button>
            <Button icon="plus" onClick={onReset}>
              {t('addAnother')}
            </Button>
          </ButtonStack>
        </Stack>
      )}
    </ScreenPage>
  );
}
