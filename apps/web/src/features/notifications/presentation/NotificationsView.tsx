import { Badge, Banner, Button, Card, EmptyState, Stack, Switch, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { Id } from '../../../core/domain/catalog';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import type { NotificationsData } from './useNotificationsViewModel';

export interface NotificationsViewProps {
  readonly state: Loadable<NotificationsData>;
  readonly saveFailed: boolean;
  readonly onRetry: () => void;
  readonly onSetMarketingConsent: (consent: boolean) => void;
  readonly onSetMerchantMuted: (merchantId: Id, muted: boolean) => void;
}

export function NotificationsView({ state, saveFailed, onRetry, onSetMarketingConsent, onSetMerchantMuted }: NotificationsViewProps) {
  const t = useTranslations(strings);
  const { locale, format } = useLocale();
  return (
    <ScreenPage title={t('title')} width="reading">
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' && (
        <Stack gap="l">
          <Card as="section" aria-label={t('consentTitle')}>
            <Text role="headline" as="h2">
              {t('consentTitle')}
            </Text>
            <Text role="supporting" tone="secondary">
              {t('consentBody')}
            </Text>
            <Switch label={t('consentLabel')} checked={state.value.preferences.marketingConsent} onChange={onSetMarketingConsent} />
          </Card>
          {saveFailed && <Banner tone="error">{t('failed')}</Banner>}
          {state.value.items.length === 0 ? (
            <EmptyState icon="info" title={t('emptyTitle')} body={t('emptyBody')} />
          ) : (
            <Stack gap="s">
              <Text role="section" as="h2">
                {t('list')}
              </Text>
              {state.value.items.map((item) => {
                const muted = item.merchantId !== null && state.value.preferences.mutedMerchantIds.includes(item.merchantId);
                return (
                  <Card as="article" key={item.id}>
                    <Stack direction="row" gap="xs">
                      {!item.isRead && <Badge tone="strong">{t('new')}</Badge>}
                      {muted && <Badge>{t('muted')}</Badge>}
                      <Text role="headline" as="h3">
                        {item.title[locale]}
                      </Text>
                    </Stack>
                    <Text role="supporting">{item.body[locale]}</Text>
                    <Text role="caption" tone="secondary" as="span">
                      {format.date(item.createdAt)}
                    </Text>
                    {item.merchantId !== null && item.merchantName !== null && (
                      <Button
                        size="compact"
                        prominence="quiet"
                        onClick={() => {
                          if (item.merchantId !== null) {
                            onSetMerchantMuted(item.merchantId, !muted);
                          }
                        }}
                      >
                        {muted ? t('unmute', { brand: item.merchantName }) : t('mute', { brand: item.merchantName })}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      )}
    </ScreenPage>
  );
}
