import { Button, EmptyState, Grid, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Id } from '../../../core/domain/catalog';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ProductCard } from '../../../core/presentation/ProductCard';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import type { BrandData } from './useBrandViewModel';

export interface BrandViewProps {
  readonly state: Loadable<BrandData>;
  readonly isFollowing: boolean;
  readonly onRetry: () => void;
  readonly onToggleFollow: (next: boolean) => void;
  readonly onOpenProduct: (id: Id) => void;
}

export function BrandView({ state, isFollowing, onRetry, onToggleFollow, onOpenProduct }: BrandViewProps) {
  const t = useTranslations(strings);
  const { locale } = useLocale();
  if (state.kind !== 'loaded' || state.value.merchant === null) {
    return (
      <ScreenPage title={state.kind === 'loaded' ? t('notFound') : t('pieces')}>
        {state.kind === 'loading' && <LoadingState />}
        {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      </ScreenPage>
    );
  }
  const { merchant, products } = state.value;
  return (
    <ScreenPage title={merchant.name} subtitle={merchant.bio[locale]} width="wide">
      <Stack gap="l">
        <Button
          size="compact"
          prominence={isFollowing ? 'secondary' : 'primary'}
          icon={isFollowing ? 'check' : 'plus'}
          aria-pressed={isFollowing}
          onClick={() => onToggleFollow(!isFollowing)}
        >
          {isFollowing ? t('following') : t('follow')}
        </Button>
        {products.length === 0 ? (
          <EmptyState icon="store" title={t('noProductsTitle')} body={t('noProductsBody')} />
        ) : (
          <Stack gap="s">
            <Text role="section" as="h2">
              {t('pieces')}
            </Text>
            <Grid itemWidth="compact">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} merchant={merchant} onOpen={() => onOpenProduct(product.id)} />
              ))}
            </Grid>
          </Stack>
        )}
      </Stack>
    </ScreenPage>
  );
}
