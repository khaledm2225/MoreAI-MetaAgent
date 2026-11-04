import { Banner, Button, Chip, Grid, Media, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Id } from '../../../core/domain/catalog';
import { cheapestPriceOf, isBuyable, priceOfVariant } from '../../../core/domain/search';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import type { AddState, ProductData } from './useProductViewModel';

export interface ProductViewProps {
  readonly state: Loadable<ProductData>;
  readonly variantId: Id | null;
  readonly addState: AddState;
  readonly onRetry: () => void;
  readonly onChooseVariant: (id: Id) => void;
  readonly onAdd: () => void;
  readonly onOpenBrand: (id: Id) => void;
  readonly onOpenCart: () => void;
}

export function ProductView({ state, variantId, addState, onRetry, onChooseVariant, onAdd, onOpenBrand, onOpenCart }: ProductViewProps) {
  const t = useTranslations(strings);
  const { locale, format } = useLocale();
  if (state.kind !== 'loaded' || state.value.product === null || state.value.merchant === null) {
    return (
      <ScreenPage title={state.kind === 'loaded' ? t('notFound') : t('loadingTitle')}>
        {state.kind === 'loading' && <LoadingState />}
        {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      </ScreenPage>
    );
  }
  const { product, merchant, colors, sizes } = state.value;
  const image = product.images[0];
  const allSoldOut = !product.variants.some(isBuyable);
  const chosen = product.variants.find(({ id }) => id === variantId);
  const price = chosen === undefined ? cheapestPriceOf(product) : priceOfVariant(product, chosen);
  const colorIds = [...new Set(product.variants.map(({ colorId }) => colorId))];
  const colorNames = colorIds.flatMap((id) => colors.find((color) => color.id === id)?.name[locale] ?? []);

  return (
    <ScreenPage title={product.name[locale]} width="wide">
      <Grid itemWidth="wide" gap="l">
        {image !== undefined && <Media src={image.path} alt={image.alt[locale]} priority />}
        <Stack gap="m">
          <Button size="compact" prominence="quiet" icon="store" onClick={() => onOpenBrand(merchant.id)}>
            {t('fromBrand', { brand: merchant.name })}
          </Button>
          <Text role="section" tone="accent" as="p">
            {format.money(price)}
          </Text>
          <Text>{product.description[locale]}</Text>
          {colorNames.length > 0 && (
            <Text role="supporting" tone="secondary">
              {t('color', { color: colorNames.join(locale === 'ar' ? '، ' : ', ') })}
            </Text>
          )}
          <Stack gap="xs" role="group" aria-label={t('sizes')}>
            <Text role="headline" as="h2">
              {t('sizes')}
            </Text>
            <Stack direction="row" gap="xs">
              {product.variants.map((variant) => (
                <Chip key={variant.id} selected={variant.id === variantId} disabled={!isBuyable(variant)} onClick={() => onChooseVariant(variant.id)}>
                  {sizes.find(({ id }) => id === variant.sizeId)?.label ?? ''}
                </Chip>
              ))}
            </Stack>
          </Stack>
          {allSoldOut ? (
            <Banner tone="info">{t('allSoldOut')}</Banner>
          ) : (
            <Button icon="bag" disabled={chosen === undefined} isLoading={addState === 'adding'} onClick={onAdd}>
              {chosen === undefined ? t('chooseSizeFirst') : t('addToCart')}
            </Button>
          )}
          {addState === 'added' && (
            <Stack gap="xs">
              <Banner tone="success">{t('added')}</Banner>
              <Button prominence="secondary" onClick={onOpenCart}>
                {t('openCart')}
              </Button>
            </Stack>
          )}
          {addState === 'failed' && <Banner tone="error">{t('addFailed')}</Banner>}
        </Stack>
      </Grid>
    </ScreenPage>
  );
}
