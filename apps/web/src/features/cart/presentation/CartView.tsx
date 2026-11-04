import { Badge, Banner, Button, Card, EmptyState, Media, QuantityStepper, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { cartTotalPiasters, groupCartByMerchant, lineTotalPiasters, type CartLine } from '../../../core/domain/cart';
import type { Id } from '../../../core/domain/catalog';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';

const MAX_QUANTITY = 20;

export interface CartViewProps {
  readonly state: Loadable<readonly CartLine[]>;
  readonly onRetry: () => void;
  readonly onSetQuantity: (lineId: Id, quantity: number) => void;
  readonly onRemove: (lineId: Id) => void;
  readonly onOpenChat: () => void;
  readonly onCheckout: () => void;
}

function LineRow({ line, onSetQuantity, onRemove }: { readonly line: CartLine } & Pick<CartViewProps, 'onSetQuantity' | 'onRemove'>) {
  const t = useTranslations(strings);
  const { locale, format } = useLocale();
  return (
    <Stack gap="xs" as="div">
      {line.imagePath !== null && <Media src={line.imagePath} alt={line.productName[locale]} ratio="landscape" />}
      <Text role="headline" as="h3">
        {line.productName[locale]}
      </Text>
      <Text role="supporting" tone="secondary">
        {`${line.colorName[locale]} · ${t('size', { size: line.sizeLabel })}`}
      </Text>
      <Text role="headline" tone="accent" as="p">
        {format.money(lineTotalPiasters(line))}
      </Text>
      {line.previousUnitPricePiasters !== null && <Banner>{t('priceChanged', { price: format.money(line.previousUnitPricePiasters) })}</Banner>}
      {line.availability === 'soldOut' && <Banner tone="error">{t('soldOut')}</Banner>}
      <Stack direction="row" gap="s">
        {line.availability === 'available' && (
          <QuantityStepper
            value={line.quantity}
            min={1}
            max={MAX_QUANTITY}
            decreaseLabel={t('less')}
            increaseLabel={t('more')}
            valueLabel={t('quantity')}
            onChange={(quantity) => onSetQuantity(line.id, quantity)}
          />
        )}
        <Button size="compact" prominence="destructive" onClick={() => onRemove(line.id)}>
          {t('remove')}
        </Button>
      </Stack>
    </Stack>
  );
}

export function CartView({ state, onRetry, onSetQuantity, onRemove, onOpenChat, onCheckout }: CartViewProps) {
  const t = useTranslations(strings);
  const { format } = useLocale();
  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')} width="reading">
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' &&
        (state.value.length === 0 ? (
          <EmptyState
            icon="bag"
            title={t('emptyTitle')}
            body={t('emptyBody')}
            action={
              <Button size="compact" icon="sparkles" onClick={onOpenChat}>
                {t('openChat')}
              </Button>
            }
          />
        ) : (
          <Stack gap="m">
            {groupCartByMerchant(state.value).map((group) => (
              <Card as="section" key={group.merchantId} aria-label={group.merchantName}>
                <Badge>{group.merchantName}</Badge>
                {group.lines.map((line) => (
                  <LineRow key={line.id} line={line} onSetQuantity={onSetQuantity} onRemove={onRemove} />
                ))}
              </Card>
            ))}
            <Card>
              <Stack direction="row" gap="s">
                <Text role="headline" as="span">
                  {t('total')}
                </Text>
                <Text role="section" tone="accent" as="span">
                  {format.money(cartTotalPiasters(state.value))}
                </Text>
              </Stack>
              <Button icon="arrowForward" disabled={state.value.some(({ availability }) => availability === 'soldOut')} onClick={onCheckout}>
                {state.value.some(({ availability }) => availability === 'soldOut') ? t('fixFirst') : t('checkout')}
              </Button>
            </Card>
          </Stack>
        ))}
    </ScreenPage>
  );
}
