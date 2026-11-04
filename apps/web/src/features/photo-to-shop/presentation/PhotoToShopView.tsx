import { Banner, Button, EmptyState, Grid, PhotoPicker, Spinner, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Id } from '../../../core/domain/catalog';
import type { DetectedPiece } from '../../../core/domain/vision';
import { ErrorState } from '../../../core/presentation/LoadStates';
import { ProductCard } from '../../../core/presentation/ProductCard';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import styles from './PhotoToShopScreen.module.css';
import { strings } from './strings';
import type { PhotoToShopState } from './usePhotoToShopViewModel';

export interface PhotoToShopViewProps {
  readonly state: PhotoToShopState;
  readonly onPick: (file: File) => void;
  readonly onSelectPiece: (piece: DetectedPiece) => void;
  readonly onReset: () => void;
  readonly onOpenProduct: (id: Id) => void;
}

/** Keeps a box on the same part of the photo in both languages, since a photo never flips. */
function physicalBox({ box }: DetectedPiece) {
  return {
    left: `${String(box.left * 100)}%`,
    top: `${String(box.top * 100)}%`,
    width: `${String((box.right - box.left) * 100)}%`,
    height: `${String((box.bottom - box.top) * 100)}%`,
  };
}

export function PhotoToShopView({ state, onPick, onSelectPiece, onReset, onOpenProduct }: PhotoToShopViewProps) {
  const t = useTranslations(strings);
  const { locale } = useLocale();
  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')} width="wide">
      <Stack gap="l">
        {state.kind === 'choosing' && (
          <Stack gap="s">
            {state.problem === 'wrongType' && <Banner tone="error">{t('wrongType')}</Banner>}
            {state.problem === 'tooLarge' && <Banner tone="error">{t('tooLarge')}</Banner>}
            <PhotoPicker label={t('choose')} hint={t('hint')} onPick={onPick} />
          </Stack>
        )}
        {state.kind === 'failed' && <ErrorState onRetry={onReset} />}
        <div className={styles.results}>
        {(state.kind === 'outlining' || state.kind === 'noPieces' || state.kind === 'pieces') && (
          <div className={styles.photoFrame} dir="ltr">
            <img className={styles.photo} src={state.photoUrl} alt={t('photoAlt')} />
            {state.kind === 'pieces' &&
              state.pieces.map((piece) => (
                <button
                  key={piece.id}
                  type="button"
                  className={styles.box}
                  style={physicalBox(piece)}
                  aria-pressed={state.selectedId === piece.id}
                  onClick={() => onSelectPiece(piece)}
                >
                  <span className={styles.boxLabel}>{piece.label[locale]}</span>
                </button>
              ))}
          </div>
        )}
        <div className={styles.matches}>
        {state.kind === 'outlining' && <Spinner label={t('outlining')} />}
        {state.kind === 'noPieces' && <EmptyState icon="image" title={t('noPiecesTitle')} body={t('noPiecesBody')} />}
        {state.kind === 'pieces' && (
          <Stack gap="s">
            {state.selectedId === null && <Banner>{t('choosePiece')}</Banner>}
            {state.pieces.length > 1 && <Banner>{t('tapAnother', { count: state.pieces.length })}</Banner>}
            {state.similar === 'loading' && <Spinner label={t('findingSimilar')} />}
            {state.similar === 'failed' && <ErrorState onRetry={onReset} />}
            {Array.isArray(state.similar) &&
              (state.similar.length === 0 ? (
                <EmptyState icon="search" title={t('noMatchesTitle')} body={t('noMatchesBody')} />
              ) : (
                <Stack gap="s">
                  <Text role="section" as="h2">
                    {t('similar')}
                  </Text>
                  <Grid itemWidth="compact">
                    {state.similar.map(({ product, merchant, reason }) => (
                      <ProductCard key={product.id} product={product} merchant={merchant} reason={reason[locale]} onOpen={() => onOpenProduct(product.id)} />
                    ))}
                  </Grid>
                </Stack>
              ))}
          </Stack>
        )}
        </div>
        </div>
        {state.kind !== 'choosing' && state.kind !== 'failed' && (
          <Button prominence="secondary" icon="camera" onClick={onReset}>
            {t('chooseAnother')}
          </Button>
        )}
      </Stack>
    </ScreenPage>
  );
}
