import { Badge, IconButton, TopBar, type IconName } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import type { CartRepository, SessionRepository, SettingsRepository } from '../core/domain/ports';
import { LanguageSwitch } from '../core/presentation/LanguageSwitch';
import { useLoadable } from '../core/presentation/useLoadable';
import { AppFrame, ScreenOutlet } from './AppFrame';
import styles from './AppFrame.module.css';
import type { AppCoordinator } from './coordinator';
import { routes } from './routes';
import { strings } from './strings';

export interface ClientShellProps {
  readonly session: Pick<SessionRepository, 'current'>;
  readonly cart: Pick<CartRepository, 'listLines' | 'subscribe'>;
  readonly settings: Pick<SettingsRepository, 'current' | 'subscribe'>;
  readonly coordinator: AppCoordinator;
}

/** Every client screen: the logo, the language, the MoreAI button, the cart and the account. */
export function ClientShell({ session, cart, settings, coordinator }: ClientShellProps) {
  const t = useTranslations(strings);
  const { format } = useLocale();
  const { pathname } = useLocation();
  const access = useLoadable(() => session.current(), [session]);
  const lines = useLoadable(() => cart.listLines(), [cart]);
  const appSettings = useLoadable(() => settings.current(), [settings]);
  const { refresh: refreshLines } = lines;
  const { refresh: refreshSettings } = appSettings;

  useEffect(() => cart.subscribe(refreshLines), [cart, refreshLines]);
  useEffect(() => settings.subscribe(refreshSettings), [settings, refreshSettings]);

  if (access.state.kind === 'loaded' && !access.state.value.clientGatePassed) {
    return <Navigate to={routes.clientGate} replace />;
  }

  const showMoreAi = appSettings.state.kind !== 'loaded' || appSettings.state.value.showMoreAiButton;
  const pieces = lines.state.kind === 'loaded' ? lines.state.value.reduce((sum, line) => sum + line.quantity, 0) : 0;
  const link = (icon: IconName, label: string, path: string, onClick: () => void) => (
    <IconButton
      icon={icon}
      label={label}
      prominence={pathname === path ? 'secondary' : 'quiet'}
      {...(pathname === path ? { 'aria-current': 'page' as const } : {})}
      onClick={onClick}
    />
  );

  return (
    <AppFrame
      onLeave={coordinator.showStart}
      bar={
        <TopBar
          start={
            <>
              <button type="button" className={styles.logoButton} aria-label={t('home')} onClick={showMoreAi ? coordinator.showChat : coordinator.showBrowse}>
                <img className={styles.logo} src="/brand/logo-red.svg" alt="" />
              </button>
              <LanguageSwitch />
            </>
          }
          end={
            <nav className={styles.nav} aria-label={t('clientNav')}>
              {showMoreAi && <IconButton icon="sparkles" label={t('askMoreAi')} prominence="primary" {...(pathname === routes.chat ? { 'aria-current': 'page' as const } : {})} onClick={coordinator.showChat} />}
              {link('store', t('browse'), routes.browse, coordinator.showBrowse)}
              {link('search', t('search'), routes.search, coordinator.showSearch)}
              {link('camera', t('photoSearch'), routes.photoToShop, coordinator.showPhotoToShop)}
              <span className={styles.cart}>
                {link('bag', pieces > 0 ? t('cartWithCount', { count: pieces }) : t('cart'), routes.cart, coordinator.showCart)}
                {pieces > 0 && (
                  <span className={styles.count} aria-hidden="true">
                    <Badge tone="strong">{format.number(pieces)}</Badge>
                  </span>
                )}
              </span>
              {link('user', t('account'), routes.account, coordinator.showAccount)}
            </nav>
          }
        />
      }
    >
      <ScreenOutlet access={access.state} onRetry={access.reload} />
    </AppFrame>
  );
}
