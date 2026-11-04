import { Banner, Button, ButtonStack, Card, Dialog, Stack, Switch, Text } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { LanguageSwitch } from '../../../core/presentation/LanguageSwitch';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import type { SettingsData } from './useSettingsViewModel';

export interface SettingsViewProps {
  readonly state: Loadable<SettingsData>;
  readonly saveFailed: boolean;
  readonly isConfirmingDelete: boolean;
  readonly isDeleting: boolean;
  readonly onRetry: () => void;
  readonly onSetShowMoreAi: (show: boolean) => void;
  readonly onSetMarketing: (consent: boolean) => void;
  readonly onAskToDelete: () => void;
  readonly onKeepAccount: () => void;
  readonly onDeleteAccount: () => void;
}

export function SettingsView({ state, saveFailed, isConfirmingDelete, isDeleting, onRetry, onSetShowMoreAi, onSetMarketing, onAskToDelete, onKeepAccount, onDeleteAccount }: SettingsViewProps) {
  const t = useTranslations(strings);
  return (
    <ScreenPage title={t('title')} width="reading">
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' && (
        <Stack gap="m">
          {saveFailed && <Banner tone="error">{t('failed')}</Banner>}
          <Card as="section" aria-label={t('language')}>
            <Text role="headline" as="h2">
              {t('language')}
            </Text>
            <LanguageSwitch />
          </Card>
          <Card as="section" aria-label={t('moreAi')}>
            <Text role="headline" as="h2">
              {t('moreAi')}
            </Text>
            <Text role="supporting" tone="secondary">
              {t('moreAiBody')}
            </Text>
            <Switch label={t('moreAiLabel')} checked={state.value.settings.showMoreAiButton} onChange={onSetShowMoreAi} />
          </Card>
          <Card as="section" aria-label={t('marketing')}>
            <Text role="headline" as="h2">
              {t('marketing')}
            </Text>
            <Text role="supporting" tone="secondary">
              {t('marketingBody')}
            </Text>
            <Switch label={t('marketingLabel')} checked={state.value.notifications.marketingConsent} onChange={onSetMarketing} />
          </Card>
          <Card as="section" aria-label={t('account')}>
            <Text role="headline" as="h2">
              {t('account')}
            </Text>
            <Text role="supporting" tone="secondary">
              {t('deleteBody')}
            </Text>
            <Button prominence="destructive" onClick={onAskToDelete}>
              {t('delete')}
            </Button>
          </Card>
          <Dialog
            open={isConfirmingDelete}
            title={t('deleteTitle')}
            onClose={onKeepAccount}
            actions={
              <ButtonStack>
                <Button prominence="secondary" onClick={onKeepAccount}>
                  {t('deleteNo')}
                </Button>
                <Button prominence="destructive" isLoading={isDeleting} onClick={onDeleteAccount}>
                  {t('deleteYes')}
                </Button>
              </ButtonStack>
            }
          >
            <Text>{t('deleteConfirmBody')}</Text>
          </Dialog>
        </Stack>
      )}
    </ScreenPage>
  );
}
