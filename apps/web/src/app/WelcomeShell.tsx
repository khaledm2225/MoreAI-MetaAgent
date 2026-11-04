import { TopBar } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { LanguageSwitch } from '../core/presentation/LanguageSwitch';
import { AppFrame, ScreenOutlet } from './AppFrame';
import styles from './AppFrame.module.css';
import { strings } from './strings';

const READY = { kind: 'loaded', value: null } as const;

/** For the steps between the first screen and a role's own shell. */
export function WelcomeShell({ onLeave }: { readonly onLeave: () => void }) {
  const t = useTranslations(strings);
  return (
    <AppFrame
      onLeave={onLeave}
      bar={
        <TopBar
          start={<img className={styles.logo} src="/brand/logo-red.svg" alt={t('logoAlt')} />}
          end={<LanguageSwitch />}
        />
      }
    >
      <ScreenOutlet access={READY} onRetry={onLeave} />
    </AppFrame>
  );
}
