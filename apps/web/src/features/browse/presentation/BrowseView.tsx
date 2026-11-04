import { Button, Chip, EmptyState, Grid, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Id, Product } from '../../../core/domain/catalog';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ProductCard } from '../../../core/presentation/ProductCard';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import type { BrowseData } from './useBrowseViewModel';

export interface BrowseViewProps {
  readonly state: Loadable<BrowseData>;
  readonly categoryId: Id | null;
  readonly visible: readonly Product[];
  readonly hasMore: boolean;
  readonly onRetry: () => void;
  readonly onSelectCategory: (id: Id | null) => void;
  readonly onShowMore: () => void;
  readonly onOpenBrand: (id: Id) => void;
  readonly onOpenProduct: (id: Id) => void;
}

export function BrowseView({ state, categoryId, visible, hasMore, onRetry, onSelectCategory, onShowMore, onOpenBrand, onOpenProduct }: BrowseViewProps) {
  const t = useTranslations(strings);
  const { locale } = useLocale();
  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')} width="wide">
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' &&
        (state.value.products.length === 0 ? (
          <EmptyState icon="store" title={t('emptyTitle')} body={t('emptyBody')} />
        ) : (
          <Stack gap="l">
            <Stack gap="xs">
              <Text role="section" as="h2">
                {t('brands')}
              </Text>
              <Stack direction="row" gap="xs">
                {state.value.merchants.map((merchant) => (
                  <Chip key={merchant.id} selected={false} onClick={() => onOpenBrand(merchant.id)}>
                    {merchant.name}
                  </Chip>
                ))}
              </Stack>
            </Stack>
            <Stack gap="s">
              <Text role="section" as="h2">
                {t('products')}
              </Text>
              <Stack direction="row" gap="xs" role="group" aria-label={t('categories')}>
                <Chip selected={categoryId === null} onClick={() => onSelectCategory(null)}>
                  {t('all')}
                </Chip>
                {state.value.categories.map((category) => (
                  <Chip key={category.id} selected={categoryId === category.id} onClick={() => onSelectCategory(category.id)}>
                    {category.name[locale]}
                  </Chip>
                ))}
              </Stack>
              <Grid itemWidth="compact">
                {visible.flatMap((product) => {
                  const merchant = state.value.merchants.find(({ id }) => id === product.merchantId);
                  return merchant === undefined
                    ? []
                    : [<ProductCard key={product.id} product={product} merchant={merchant} onOpen={() => onOpenProduct(product.id)} />];
                })}
              </Grid>
              {hasMore && (
                <Button prominence="secondary" onClick={onShowMore}>
                  {t('showMore')}
                </Button>
              )}
            </Stack>
          </Stack>
        ))}
    </ScreenPage>
  );
}
