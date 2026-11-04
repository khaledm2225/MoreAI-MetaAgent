import { Badge, Banner, Button, ButtonStack, Card, Dialog, EmptyState, RatingStars, Stack, Text } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import type { Id } from '../../../core/domain/catalog';
import type { ShopperRecord } from '../../../core/domain/merchant';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';

export interface ShopperHistoryViewProps {
  readonly state: Loadable<readonly ShopperRecord[]>;
  readonly stopping: Id | null;
  readonly saveFailed: boolean;
  readonly onRetry: () => void;
  readonly onRate: (id: Id, stars: number) => void;
  readonly onAskToStop: (id: Id) => void;
  readonly onKeepAccepting: () => void;
  readonly onSetBlocked: (id: Id, blocked: boolean) => void;
}

export function ShopperHistoryView({ state, stopping, saveFailed, onRetry, onRate, onAskToStop, onKeepAccepting, onSetBlocked }: ShopperHistoryViewProps) {
  const t = useTranslations(strings);
  const stoppingRecord = state.kind === 'loaded' ? state.value.find(({ shopperId }) => shopperId === stopping) : undefined;
  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')}>
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {saveFailed && <Banner tone="error">{t('failed')}</Banner>}
      {state.kind === 'loaded' &&
        (state.value.length === 0 ? (
          <EmptyState icon="user" title={t('emptyTitle')} body={t('emptyBody')} />
        ) : (
          <Stack gap="s">
            {state.value.map((record) => (
              <Card as="article" key={record.shopperId} aria-label={record.displayName}>
                <Stack direction="row" gap="xs">
                  <Text role="headline" as="h2">
                    {record.displayName}
                  </Text>
                  {record.isBlocked && <Badge tone="strong">{t('stopped')}</Badge>}
                </Stack>
                <Text role="supporting">{t('record', { received: record.ordersReceived, placed: record.ordersPlaced })}</Text>
                <Text role="supporting" tone={record.ordersRefused > 0 ? 'danger' : 'secondary'}>
                  {record.ordersRefused > 0 ? t('refused', { count: record.ordersRefused }) : t('noneRefused')}
                </Text>
                <RatingStars
                  value={record.merchantRating ?? 0}
                  label={`${t('rating')}: ${record.displayName}`}
                  optionLabels={[t('one'), t('two'), t('three'), t('four'), t('five')]}
                  onChange={(stars) => onRate(record.shopperId, stars)}
                />
                {record.isBlocked ? (
                  <Button size="compact" prominence="secondary" onClick={() => onSetBlocked(record.shopperId, false)}>
                    {t('resume')}
                  </Button>
                ) : (
                  <Button size="compact" prominence="destructive" icon="close" onClick={() => onAskToStop(record.shopperId)}>
                    {t('stop')}
                  </Button>
                )}
              </Card>
            ))}
          </Stack>
        ))}
      <Dialog
        open={stoppingRecord !== undefined}
        title={t('stopTitle', { name: stoppingRecord?.displayName ?? '' })}
        onClose={onKeepAccepting}
        actions={
          <ButtonStack>
            <Button prominence="secondary" onClick={onKeepAccepting}>
              {t('stopNo')}
            </Button>
            <Button
              prominence="destructive"
              icon="close"
              onClick={() => {
                if (stoppingRecord !== undefined) {
                  onSetBlocked(stoppingRecord.shopperId, true);
                }
              }}
            >
              {t('stopYes')}
            </Button>
          </ButtonStack>
        }
      >
        <Text>{t('stopBody')}</Text>
      </Dialog>
    </ScreenPage>
  );
}
