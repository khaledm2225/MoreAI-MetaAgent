import { Badge, Button, Container, Ground, Text } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { LanguageSwitch } from '../../../core/presentation/LanguageSwitch';
import { strings as sharedStrings } from '../../../core/presentation/strings';
import { strings } from './strings';
import styles from './StartScreen.module.css';

export interface StartScreenProps {
  readonly onJoinAsClient: () => void;
  readonly onJoinAsMerchant: () => void;
}

/** The first screen: the 2 ways into the product, with no login. */
export function StartScreen({ onJoinAsClient, onJoinAsMerchant }: StartScreenProps) {
  const t = useTranslations(strings);
  const shared = useTranslations(sharedStrings);
  return (
    <Ground kind="brand" as="main" fillViewport className={styles.page}>
      <Container width="wide" className={styles.layout}>
        <header className={styles.header}>
          <img className={styles.logo} src="/brand/logo-cream.svg" alt={t('logoAlt')} />
          <LanguageSwitch />
        </header>

        <div className={styles.body}>
          <div className={styles.words}>
            <Text role="hero" as="h1">
              {t('headline')}
            </Text>
            <Text role="section" as="p">
              {t('descriptor')}
            </Text>
            <div className={styles.actions}>
              <Button onClick={onJoinAsClient}>{t('joinAsClient')}</Button>
              <Button prominence="secondary" onClick={onJoinAsMerchant}>
                {t('joinAsMerchant')}
              </Button>
            </div>
            <Badge>{shared('demoNotice')}</Badge>
          </div>
          <img className={styles.character} src="/brand/character.svg" alt="" />
        </div>
      </Container>
    </Ground>
  );
}
