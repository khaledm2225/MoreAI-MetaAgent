import { Badge, Button, ButtonStack, Card, EmptyState, ProgressBar, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { MerchantDashboard } from '../../../core/domain/merchant';
import { FREE_ORDERS_PER_BRAND, freeOrdersLeft } from '../../../core/domain/order';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { orderStatusStrings } from '../../../core/presentation/orderStatusStrings';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';

export interface MerchantDashboardViewProps {
  readonly state: Loadable<MerchantDashboard>;
  readonly onRetry: () => void;
  readonly onOpenOrders: () => void;
  readonly onAddProduct: () => void;
}

export function MerchantDashboardView({ state, onRetry, onOpenOrders, onAddProduct }: MerchantDashboardViewProps) {
  const t = useTranslations(strings);
  const status = useTranslations(orderStatusStrings);
  const { format } = useLocale();
  return (
    <ScreenPage title={state.kind === 'loaded' ? state.value.merchant.name : t('title')} subtitle={t('title')}>
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' && (
        <Stack gap="m">
          <Card as="section" aria-label={t('freeOrders')}>
            <Text role="headline" as="h2">
              {t('freeOrders')}
            </Text>
            <ProgressBar
              label={t('freeOrders')}
              value={state.value.ordersSoFar}
              max={FREE_ORDERS_PER_BRAND}
              valueText={t('freeOrdersText', { count: freeOrdersLeft(state.value.ordersSoFar) })}
            />
            <Text role="supporting" tone="secondary">
              {t('noFeesBody')}
            </Text>
          </Card>
          <ButtonStack>
            <Button icon="plus" onClick={onAddProduct}>
              {t('addProduct')}
            </Button>
            <Button prominence="secondary" icon="package" onClick={onOpenOrders}>
              {t('openOrders')}
            </Button>
          </ButtonStack>
          {state.value.ordersToday.length === 0 ? (
            <EmptyState icon="package" title={t('noOrdersTitle')} body={t('noOrdersBody')} />
          ) : (
            <Card as="section" aria-label={t('todayTitle')}>
              <Text role="headline" as="h2">
                {t('todayTitle')}
              </Text>
              {state.value.ordersToday.map((order) => (
                <Stack key={order.id} direction="row" gap="xs">
                  <Badge tone="strong">{status(order.status)}</Badge>
                  <Text role="supporting" as="span">
                    {`${order.orderNumber} · ${format.money(order.totalPiasters)}`}
                  </Text>
                </Stack>
              ))}
            </Card>
          )}
        </Stack>
      )}
    </ScreenPage>
  );
}
