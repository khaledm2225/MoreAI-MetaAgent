import { Badge, Banner, Button, ButtonStack, Card, Confetti, Dialog, EmptyState, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Address } from '../../../core/domain/order';
import { AddressForm } from '../../../core/presentation/AddressForm';
import { LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import { strings } from './strings';
import type { CheckoutState, CheckoutSummary } from './useCheckoutViewModel';

export interface CheckoutViewProps {
  readonly state: CheckoutState;
  readonly onReview: (address: Address) => void;
  readonly onCancel: () => void;
  readonly onPlace: () => void;
  readonly onOpenOrders: () => void;
  readonly onOpenCart: () => void;
}

function Summary({ summary }: { readonly summary: CheckoutSummary }) {
  const t = useTranslations(strings);
  const { format } = useLocale();
  return (
    <Stack gap="xs">
      <Text>{t('confirmBody', { count: summary.orderCount })}</Text>
      <Text role="supporting" tone="secondary">{`${t('subtotal')}: ${format.money(summary.subtotalPiasters)}`}</Text>
      <Text role="supporting" tone="secondary">{`${t('delivery')}: ${format.money(summary.deliveryPiasters)}`}</Text>
      <Text role="section" tone="accent" as="p">{`${t('total')}: ${format.money(summary.subtotalPiasters + summary.deliveryPiasters)}`}</Text>
    </Stack>
  );
}

export function CheckoutView({ state, onReview, onCancel, onPlace, onOpenOrders, onOpenCart }: CheckoutViewProps) {
  const t = useTranslations(strings);
  const { format } = useLocale();
  const openCart = (
    <Button size="compact" prominence="secondary" onClick={onOpenCart}>
      {t('openCart')}
    </Button>
  );
  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')} width="reading">
      {state.kind === 'address' && (
        <Stack gap="s">
          {state.hasFailed && <Banner tone="error">{t('failed')}</Banner>}
          <Card>
            <AddressForm submitLabel={t('continue')} onSubmit={onReview} />
          </Card>
        </Stack>
      )}
      {state.kind === 'loadingSummary' && <LoadingState />}
      {(state.kind === 'confirming' || state.kind === 'placing') && (
        <Dialog
          open
          title={t('confirmTitle')}
          onClose={onCancel}
          actions={
            <ButtonStack>
              <Button prominence="secondary" disabled={state.kind === 'placing'} onClick={onCancel}>
                {t('cancel')}
              </Button>
              <Button icon="check" isLoading={state.kind === 'placing'} onClick={onPlace}>
                {t('place')}
              </Button>
            </ButtonStack>
          }
        >
          <Summary summary={state.summary} />
        </Dialog>
      )}
      {state.kind === 'placed' && (
        <Card>
          <Confetti />
          <Text role="title" as="h2">
            {t('placedTitle')}
          </Text>
          <Text>{t('placedBody', { count: state.orders.length })}</Text>
          {state.orders.map((order) => (
            <Stack key={order.id} direction="row" gap="xs">
              <Badge>{order.merchantName}</Badge>
              <Text role="supporting" as="span">
                {`${order.orderNumber} · ${format.money(order.totalPiasters)}`}
              </Text>
            </Stack>
          ))}
          <Button onClick={onOpenOrders}>{t('seeOrders')}</Button>
        </Card>
      )}
      {state.kind === 'dailyLimit' && (
        <EmptyState icon="info" title={t('dailyLimitTitle')} body={state.reason === 'BRAND_DAILY_LIMIT' ? t('brandLimit') : t('shopperLimit')} action={openCart} />
      )}
      {state.kind === 'blocked' && <EmptyState icon="alert" title={t('blockedTitle')} body={t('blockedBody')} action={openCart} />}
      {state.kind === 'changed' && <EmptyState icon="info" title={t('changedTitle')} body={t('changedBody')} action={openCart} />}
      {state.kind === 'empty' && <EmptyState icon="bag" title={t('emptyTitle')} body={t('emptyBody')} action={openCart} />}
    </ScreenPage>
  );
}
