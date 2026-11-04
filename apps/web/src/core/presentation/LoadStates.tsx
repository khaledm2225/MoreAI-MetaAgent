import { Banner, Button, Spinner, Stack, Text } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { strings } from './strings';

/** The loading state every screen shares. */
export function LoadingState() {
  const t = useTranslations(strings);
  return <Spinner label={t('loading')} />;
}

/** The error state every screen shares, with a way to try again. */
export function ErrorState({ onRetry }: { readonly onRetry: () => void }) {
  const t = useTranslations(strings);
  return (
    <Stack gap="s">
      <Banner tone="error">
        <Text role="headline" as="p">
          {t('errorTitle')}
        </Text>
        <Text role="supporting">{t('errorBody')}</Text>
      </Banner>
      <Button prominence="secondary" onClick={onRetry}>
        {t('tryAgain')}
      </Button>
    </Stack>
  );
}
