import { Banner, Button, Card, Container, Stack, Text } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { strings as sharedStrings } from '../../../core/presentation/strings';
import styles from './ClientGateScreen.module.css';
import { strings } from './strings';
import type { ClientGateState } from './useClientGateViewModel';

export interface ClientGateViewProps {
  readonly state: ClientGateState;
  readonly onConfirmAdult: () => void;
  readonly onConfirmMinor: () => void;
  readonly onBack: () => void;
}

export function ClientGateView({ state, onConfirmAdult, onConfirmMinor, onBack }: ClientGateViewProps) {
  const t = useTranslations(strings);
  const shared = useTranslations(sharedStrings);
  if (state === 'underAge') {
    return (
      <Container width="reading" className={styles.page}>
        <Card>
          <Text role="title" as="h1">
            {t('refusalTitle')}
          </Text>
          <Text>{t('refusalBody')}</Text>
          <Button prominence="secondary" onClick={onBack}>
            {t('back')}
          </Button>
        </Card>
      </Container>
    );
  }
  return (
    <Container width="reading" className={styles.page}>
      <Card>
        <Stack gap="m">
          <Text role="title" as="h1">
            {t('title')}
          </Text>
          <Text>{t('disclosure')}</Text>
          <Text>{t('confirms')}</Text>
          <Text role="headline" as="h2">
            {t('ageQuestion')}
          </Text>
          {state === 'failed' && <Banner tone="error">{shared('errorBody')}</Banner>}
          <Button isLoading={state === 'saving'} onClick={onConfirmAdult}>
            {t('isAdult')}
          </Button>
          <Button prominence="secondary" onClick={onConfirmMinor}>
            {t('isMinor')}
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
