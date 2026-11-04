import { Banner, Button, Card, EmptyState, Grid, Media, Stack, Tabs, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Id, Product, ProductStatus } from '../../../core/domain/catalog';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';

export interface MerchantProductsViewProps {
  readonly state: Loadable<readonly Product[]>;
  readonly status: ProductStatus;
  readonly saveFailed: boolean;
  readonly onRetry: () => void;
  readonly onSelectStatus: (status: ProductStatus) => void;
  readonly onMove: (productId: Id, next: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED') => void;
  readonly onAdd: () => void;
}

export function MerchantProductsView({ state, status, saveFailed, onRetry, onSelectStatus, onMove, onAdd }: MerchantProductsViewProps) {
  const t = useTranslations(strings);
  const { locale, format } = useLocale();
  const tabs: readonly { id: ProductStatus; label: string }[] = [
    { id: 'ACTIVE', label: t('live') },
    { id: 'DRAFT', label: t('draft') },
    { id: 'HIDDEN', label: t('hidden') },
    { id: 'ARCHIVED', label: t('archived') },
  ];
  const addButton = (
    <Button icon="plus" onClick={onAdd}>
      {t('add')}
    </Button>
  );
  return (
    <ScreenPage title={t('title')} width="wide">
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' &&
        (state.value.length === 0 ? (
          <EmptyState icon="store" title={t('emptyTitle')} body={t('emptyBody')} action={addButton} />
        ) : (
          <Stack gap="m">
            {addButton}
            <Tabs
              label={t('statusLabel')}
              tabs={tabs}
              selectedId={status}
              onSelect={(id) => onSelectStatus(id as ProductStatus)}
            />
            {saveFailed && <Banner tone="error">{t('failed')}</Banner>}
            {state.value.filter((product) => product.status === status).length === 0 ? (
              <Text tone="secondary">{t('emptyStatus')}</Text>
            ) : (
              <Grid itemWidth="compact">
                {state.value
                  .filter((product) => product.status === status)
                  .map((product) => {
                    const image = product.images[0];
                    return (
                      <Card as="article" key={product.id}>
                        {image !== undefined && <Media src={image.path} alt={image.alt[locale]} />}
                        <Text role="headline" as="h2">
                          {product.name[locale]}
                        </Text>
                        <Text role="supporting" tone="accent" as="p">
                          {format.money(product.pricePiasters)}
                        </Text>
                        <Stack direction="row" gap="xs">
                          {product.status !== 'ACTIVE' && (
                            <Button size="compact" onClick={() => onMove(product.id, 'ACTIVE')}>
                              {t('show')}
                            </Button>
                          )}
                          {product.status === 'ACTIVE' && (
                            <Button size="compact" prominence="secondary" onClick={() => onMove(product.id, 'HIDDEN')}>
                              {t('hide')}
                            </Button>
                          )}
                          {product.status !== 'ARCHIVED' && (
                            <Button size="compact" prominence="quiet" onClick={() => onMove(product.id, 'ARCHIVED')}>
                              {t('archive')}
                            </Button>
                          )}
                        </Stack>
                      </Card>
                    );
                  })}
              </Grid>
            )}
          </Stack>
        ))}
    </ScreenPage>
  );
}
