import { Badge, Banner, Button, ButtonStack, Card, Dialog, EmptyState, Stack, Tabs, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Id } from '../../../core/domain/catalog';
import { nextOrderStatuses, type Order, type OrderStatus } from '../../../core/domain/order';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { orderStatusStrings } from '../../../core/presentation/orderStatusStrings';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import { tabOf, type OrdersTab } from './useMerchantOrdersViewModel';

export interface MerchantOrdersViewProps {
  readonly state: Loadable<readonly Order[]>;
  readonly tab: OrdersTab;
  readonly rejecting: Id | null;
  readonly saveFailed: boolean;
  readonly onRetry: () => void;
  readonly onSelectTab: (tab: OrdersTab) => void;
  readonly onMove: (orderId: Id, status: OrderStatus) => void;
  readonly onAskToReject: (orderId: Id) => void;
  readonly onKeepOrder: () => void;
}

export function MerchantOrdersView({ state, tab, rejecting, saveFailed, onRetry, onSelectTab, onMove, onAskToReject, onKeepOrder }: MerchantOrdersViewProps) {
  const t = useTranslations(strings);
  const status = useTranslations(orderStatusStrings);
  const { locale, format } = useLocale();
  const moveLabels: Readonly<Partial<Record<OrderStatus, string>>> = {
    ACCEPTED: t('accept'),
    OUT_FOR_DELIVERY: t('outForDelivery'),
    DELIVERED: t('delivered'),
    NOT_DELIVERED: t('notDelivered'),
    CANCELLED: t('cancel'),
  };
  const tabs: readonly { id: OrdersTab; label: string }[] = [
    { id: 'new', label: t('new') },
    { id: 'inProgress', label: t('inProgress') },
    { id: 'finished', label: t('finished') },
  ];
  const visible = state.kind === 'loaded' ? state.value.filter((order) => tabOf(order.status) === tab) : [];
  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')}>
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' &&
        (state.value.length === 0 ? (
          <EmptyState icon="package" title={t('emptyTitle')} body={t('emptyBody')} />
        ) : (
          <Stack gap="m">
            <Tabs label={t('statusLabel')} tabs={tabs} selectedId={tab} onSelect={(id) => onSelectTab(id as OrdersTab)} />
            {saveFailed && <Banner tone="error">{t('failed')}</Banner>}
            {visible.length === 0 && <Text tone="secondary">{t('emptyStatus')}</Text>}
            {visible.map((order) => (
              <Card as="article" key={order.id}>
                <Stack direction="row" gap="xs">
                  <Badge tone="strong">{status(order.status)}</Badge>
                  <Text role="headline" as="h2">
                    {order.orderNumber}
                  </Text>
                  <Text role="headline" tone="accent" as="span">
                    {format.money(order.totalPiasters)}
                  </Text>
                </Stack>
                {order.items.map((item) => (
                  <Text key={item.id} role="supporting">
                    {t('pieces', { count: item.quantity, name: `${item.productName[locale]} · ${item.sizeLabel}` })}
                  </Text>
                ))}
                <Text role="supporting" tone="secondary" dir="auto">
                  {t('deliverTo', { name: order.address.recipientName, street: order.address.street, area: order.address.area })}
                </Text>
                <Stack direction="row" gap="xs">
                  {nextOrderStatuses(order.status).map((next) =>
                    next === 'REJECTED' ? (
                      <Button key={next} size="compact" prominence="destructive" onClick={() => onAskToReject(order.id)}>
                        {t('reject')}
                      </Button>
                    ) : (
                      <Button key={next} size="compact" prominence={next === 'CANCELLED' || next === 'NOT_DELIVERED' ? 'quiet' : 'primary'} onClick={() => onMove(order.id, next)}>
                        {moveLabels[next] ?? status(next)}
                      </Button>
                    ),
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        ))}
      <Dialog
        open={rejecting !== null}
        title={t('rejectTitle')}
        onClose={onKeepOrder}
        actions={
          <ButtonStack>
            <Button prominence="secondary" onClick={onKeepOrder}>
              {t('rejectNo')}
            </Button>
            <Button
              prominence="destructive"
              onClick={() => {
                if (rejecting !== null) {
                  onMove(rejecting, 'REJECTED');
                }
              }}
            >
              {t('rejectYes')}
            </Button>
          </ButtonStack>
        }
      >
        <Text>{t('rejectBody')}</Text>
      </Dialog>
    </ScreenPage>
  );
}
