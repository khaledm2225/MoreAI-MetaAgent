import { Badge, Button, EmptyState, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Id } from '../../../core/domain/catalog';
import { isFinishedOrder, type Order } from '../../../core/domain/order';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { orderStatusStrings } from '../../../core/presentation/orderStatusStrings';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import styles from './OrdersView.module.css';
import { strings } from './strings';

export interface OrdersViewProps {
  readonly state: Loadable<readonly Order[]>;
  readonly onRetry: () => void;
  readonly onOpenOrder: (id: Id) => void;
  readonly onOpenChat: () => void;
}

function OrderRow({ order, onOpen }: { readonly order: Order; readonly onOpen: () => void }) {
  const t = useTranslations(strings);
  const status = useTranslations(orderStatusStrings);
  const { format } = useLocale();
  const pieces = order.items.reduce((total, { quantity }) => total + quantity, 0);
  return (
    <button type="button" className={styles.order} onClick={onOpen}>
      <Stack direction="row" gap="xs">
        <Badge tone={isFinishedOrder(order.status) ? 'calm' : 'strong'}>{status(order.status)}</Badge>
        <Text role="headline" as="span">
          {order.merchantName}
        </Text>
      </Stack>
      <Text role="supporting" tone="secondary" as="span">
        {`${order.orderNumber} · ${t('pieces', { count: pieces })} · ${format.date(order.placedAt)}`}
      </Text>
      <Text role="headline" tone="accent" as="span">
        {format.money(order.totalPiasters)}
      </Text>
    </button>
  );
}

export function OrdersView({ state, onRetry, onOpenOrder, onOpenChat }: OrdersViewProps) {
  const t = useTranslations(strings);
  function group(title: string, orders: readonly Order[]) {
    return (
      orders.length > 0 && (
        <Stack gap="s">
          <Text role="section" as="h2">
            {title}
          </Text>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onOpen={() => onOpenOrder(order.id)} />
          ))}
        </Stack>
      )
    );
  }
  return (
    <ScreenPage title={t('title')} width="reading">
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' &&
        (state.value.length === 0 ? (
          <EmptyState
            icon="package"
            title={t('emptyTitle')}
            body={t('emptyBody')}
            action={
              <Button size="compact" icon="sparkles" onClick={onOpenChat}>
                {t('askMoreAi')}
              </Button>
            }
          />
        ) : (
          <Stack gap="l">
            {group(t('active'), state.value.filter(({ status }) => !isFinishedOrder(status)))}
            {group(t('past'), state.value.filter(({ status }) => isFinishedOrder(status)))}
          </Stack>
        ))}
    </ScreenPage>
  );
}
