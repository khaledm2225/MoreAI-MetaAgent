import { Banner, Button, Card, Grid, RatingStars, StatusTimeline, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { canRateOrder, type Order } from '../../../core/domain/order';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { orderStatusStrings } from '../../../core/presentation/orderStatusStrings';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { orderTimeline } from '../domain/timeline';
import { strings } from './strings';

export interface OrderDetailsViewProps {
  readonly state: Loadable<Order | null>;
  readonly onRetry: () => void;
  readonly onRate: () => void;
}

export function OrderDetailsView({ state, onRetry, onRate }: OrderDetailsViewProps) {
  const t = useTranslations(strings);
  const status = useTranslations(orderStatusStrings);
  const { locale, format } = useLocale();
  if (state.kind !== 'loaded' || state.value === null) {
    return (
      <ScreenPage title={state.kind === 'loaded' ? t('notFound') : t('loadingTitle')}>
        {state.kind === 'loading' && <LoadingState />}
        {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      </ScreenPage>
    );
  }
  const order = state.value;
  return (
    <ScreenPage title={t('title', { number: order.orderNumber })} subtitle={t('fromBrand', { brand: order.merchantName })}>
      <Grid itemWidth="wide" gap="l">
        <Stack gap="m">
          <Card>
            <StatusTimeline
              label={t('timeline')}
              steps={orderTimeline(order.status).map((step) => ({ id: step.status, label: status(step.status), state: step.state }))}
            />
          </Card>
          {order.status === 'REJECTED' && <Banner tone="error">{t('rejected')}</Banner>}
          {order.status === 'CANCELLED' && <Banner tone="error">{t('cancelled')}</Banner>}
          {order.status === 'NOT_DELIVERED' && <Banner tone="error">{t('notDelivered')}</Banner>}
          {canRateOrder(order) && (
            <Button icon="star" onClick={onRate}>
              {t('rate')}
            </Button>
          )}
          {order.rating !== null && (
            <Card>
              <Text role="headline" as="p">
                {t('rated')}
              </Text>
              <RatingStars value={order.rating.stars} label={`${String(order.rating.stars)} / 5`} />
            </Card>
          )}
        </Stack>
        <Card as="section" aria-label={t('pieces')}>
          <Text role="section" as="h2">
            {t('pieces')}
          </Text>
          {order.items.map((item) => (
            <Stack key={item.id} gap="xxs">
              <Text role="headline" as="h3">
                {item.productName[locale]}
              </Text>
              <Text role="supporting" tone="secondary">
                {`${item.colorName[locale]} · ${t('size', { size: item.sizeLabel })} · ${t('quantity', { count: item.quantity })}`}
              </Text>
              <Text role="supporting">{format.money(item.lineTotalPiasters)}</Text>
            </Stack>
          ))}
          <Stack gap="xxs">
            <Text role="supporting" tone="secondary">{`${t('subtotal')}: ${format.money(order.subtotalPiasters)}`}</Text>
            <Text role="supporting" tone="secondary">{`${t('delivery')}: ${format.money(order.deliveryFeePiasters)}`}</Text>
            <Text role="section" tone="accent" as="p">{`${t('total')}: ${format.money(order.totalPiasters)}`}</Text>
          </Stack>
          <Stack gap="xxs">
            <Text role="label" as="p">
              {t('deliverTo')}
            </Text>
            <Text role="supporting" dir="auto">{`${order.address.recipientName}, ${order.address.street}, ${order.address.area}`}</Text>
          </Stack>
        </Card>
      </Grid>
    </ScreenPage>
  );
}
