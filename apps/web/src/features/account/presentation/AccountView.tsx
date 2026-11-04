import { AnimatedBullets, Banner, Button, ButtonStack, Card, EmptyState, Grid, IconButton, Stack, Text, TextField } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { useState, type FormEvent } from 'react';
import type { Id } from '../../../core/domain/catalog';
import type { Preference } from '../../../core/domain/taste';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import type { EditState } from './useAccountViewModel';

export interface AccountViewProps {
  readonly state: Loadable<readonly Preference[]>;
  readonly edit: EditState;
  readonly onRetry: () => void;
  readonly onStartEditing: () => void;
  readonly onCancelEditing: () => void;
  readonly onAdd: (text: string) => void;
  readonly onRemove: (id: Id) => void;
  readonly onOpenOrders: () => void;
  readonly onOpenNotifications: () => void;
  readonly onOpenSettings: () => void;
}

export function AccountView({ state, edit, onRetry, onStartEditing, onCancelEditing, onAdd, onRemove, onOpenOrders, onOpenNotifications, onOpenSettings }: AccountViewProps) {
  const t = useTranslations(strings);
  const { locale } = useLocale();
  const [draft, setDraft] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    onAdd(draft);
    setDraft('');
  }

  const isEditing = edit === 'editing' || edit === 'saving' || edit === 'failed';

  return (
    <ScreenPage title={t('title')} subtitle={t('demoShopper')}>
      <Grid itemWidth="wide" gap="l">
        <Card as="section" aria-label={t('preferences')}>
          <Stack gap="xxs">
            <Text role="section" as="h2">
              {t('preferences')}
            </Text>
            <Text role="supporting" tone="secondary">
              {t('preferencesBody')}
            </Text>
          </Stack>
          {state.kind === 'loading' && <LoadingState />}
          {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
          {state.kind === 'loaded' &&
            (state.value.length === 0 ? (
              <EmptyState icon="sparkles" title={t('emptyTitle')} body={t('emptyBody')} />
            ) : (
              <AnimatedBullets
                label={t('preferences')}
                items={state.value.map((preference) => ({
                  id: preference.id,
                  content: (
                    <Stack direction="row" gap="xs">
                      <Text as="span">{preference.text[locale]}</Text>
                      <IconButton
                        icon="close"
                        prominence="quiet"
                        label={t('remove', { name: preference.text[locale] })}
                        onClick={() => onRemove(preference.id)}
                      />
                    </Stack>
                  ),
                }))}
              />
            ))}
          {edit === 'saved' && <Banner tone="success">{t('saved')}</Banner>}
          {edit === 'failed' && <Banner tone="error">{t('saveFailed')}</Banner>}
          {isEditing ? (
            <form onSubmit={submit}>
              <Stack gap="s">
                <TextField label={t('newPreference')} placeholder={t('newPlaceholder')} value={draft} onChange={(event) => setDraft(event.target.value)} />
                <ButtonStack>
                  <Button prominence="secondary" onClick={onCancelEditing}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" isLoading={edit === 'saving'}>
                    {t('save')}
                  </Button>
                </ButtonStack>
              </Stack>
            </form>
          ) : (
            <Button prominence="secondary" icon="plus" onClick={onStartEditing}>
              {t('add')}
            </Button>
          )}
        </Card>
        <Stack gap="s">
          <Button prominence="secondary" icon="package" onClick={onOpenOrders}>
            {t('orders')}
          </Button>
          <Button prominence="secondary" icon="info" onClick={onOpenNotifications}>
            {t('notifications')}
          </Button>
          <Button prominence="secondary" icon="user" onClick={onOpenSettings}>
            {t('settings')}
          </Button>
        </Stack>
      </Grid>
    </ScreenPage>
  );
}
