import { Badge, Banner, Button, ButtonStack, Card, EmptyState, Stack, Text, TextField } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { useState, type FormEvent } from 'react';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import type { CampaignsData, ComposeState } from './usePushCampaignsViewModel';

export interface PushCampaignsViewProps {
  readonly state: Loadable<CampaignsData>;
  readonly compose: ComposeState;
  readonly onRetry: () => void;
  readonly onStartWriting: () => void;
  readonly onCancel: () => void;
  readonly onSend: (title: string, body: string) => void;
}

export function PushCampaignsView({ state, compose, onRetry, onStartWriting, onCancel, onSend }: PushCampaignsViewProps) {
  const t = useTranslations(strings);
  const { format } = useLocale();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    onSend(title, body);
  }

  const noConsent = state.kind === 'loaded' && state.value.audience.withConsent === 0;

  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')}>
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' && (
        <Stack gap="m">
          <Card as="section" aria-label={t('audience')}>
            <Text role="headline" as="h2">
              {t('audience')}
            </Text>
            {noConsent ? (
              <Banner>{t('noConsent')}</Banner>
            ) : (
              <Text role="supporting">
                {t('audienceBody', {
                  withConsent: state.value.audience.withConsent,
                  followers: state.value.audience.followers,
                  buyers: state.value.audience.buyers,
                })}
              </Text>
            )}
            <Text role="supporting" tone="secondary">
              {t('brandName')}
            </Text>
          </Card>
          {compose === 'closed' ? (
            !noConsent && (
              <Button icon="send" onClick={onStartWriting}>
                {t('write')}
              </Button>
            )
          ) : (
            <Card>
              <form noValidate onSubmit={submit}>
                <Stack gap="s">
                  <TextField label={t('titleLabel')} value={title} onChange={(event) => setTitle(event.target.value)} {...(compose === 'invalid' && title.trim() === '' ? { error: t('required') } : {})} />
                  <TextField label={t('bodyLabel')} multiline value={body} onChange={(event) => setBody(event.target.value)} {...(compose === 'invalid' && body.trim() === '' ? { error: t('required') } : {})} />
                  {compose === 'failed' && <Banner tone="error">{t('sendFailed')}</Banner>}
                  <ButtonStack>
                    <Button prominence="secondary" onClick={onCancel}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" icon="send" isLoading={compose === 'sending'}>
                      {t('send')}
                    </Button>
                  </ButtonStack>
                </Stack>
              </form>
            </Card>
          )}
          {state.value.campaigns.length === 0 ? (
            compose === 'closed' && <EmptyState icon="send" title={t('emptyTitle')} body={t('emptyBody')} />
          ) : (
            <Stack gap="s">
              <Text role="section" as="h2">
                {t('results')}
              </Text>
              {state.value.campaigns.map((campaign) => (
                <Card as="article" key={campaign.id}>
                  <Text role="headline" as="h3" dir="auto">
                    {campaign.title}
                  </Text>
                  <Text role="supporting" dir="auto">
                    {campaign.body}
                  </Text>
                  <Stack direction="row" gap="xs">
                    <Badge>{t('sent', { count: campaign.audienceSize })}</Badge>
                    <Badge>{t('opens', { count: campaign.opens })}</Badge>
                    <Badge tone="strong">{t('orders', { count: campaign.orders })}</Badge>
                  </Stack>
                  {campaign.sentAt !== null && (
                    <Text role="caption" tone="secondary" as="span">
                      {format.date(campaign.sentAt)}
                    </Text>
                  )}
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </ScreenPage>
  );
}
