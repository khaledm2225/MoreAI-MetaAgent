import { Button, Container, TopBar } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { Navigate, useLocation } from 'react-router';
import type { MerchantProfileRepository } from '../core/domain/ports';
import { LanguageSwitch } from '../core/presentation/LanguageSwitch';
import { useLoadable } from '../core/presentation/useLoadable';
import { AppFrame, ScreenOutlet } from './AppFrame';
import styles from './AppFrame.module.css';
import type { AppCoordinator } from './coordinator';
import { routes } from './routes';
import { strings } from './strings';

export interface MerchantShellProps {
  readonly profile: Pick<MerchantProfileRepository, 'current'>;
  readonly coordinator: AppCoordinator;
}

/** Every merchant screen. Someone who hasn't joined yet goes to the join form first. */
export function MerchantShell({ profile, coordinator }: MerchantShellProps) {
  const t = useTranslations(strings);
  const { pathname } = useLocation();
  const access = useLoadable(() => profile.current(), [profile]);

  if (access.state.kind === 'loaded' && access.state.value === null) {
    return <Navigate to={routes.merchantJoin} replace />;
  }

  const destinations = [
    { label: t('dashboard'), path: routes.merchantDashboard, show: coordinator.showMerchantDashboard },
    { label: t('products'), path: routes.merchantProducts, show: coordinator.showMerchantProducts },
    { label: t('orders'), path: routes.merchantOrders, show: coordinator.showMerchantOrders },
    { label: t('shoppers'), path: routes.merchantShoppers, show: coordinator.showMerchantShoppers },
    { label: t('campaigns'), path: routes.merchantCampaigns, show: coordinator.showMerchantCampaigns },
  ];

  return (
    <AppFrame
      onLeave={coordinator.showStart}
      bar={
        <TopBar
          start={
            <button type="button" className={styles.logoButton} aria-label={t('dashboard')} onClick={coordinator.showMerchantDashboard}>
              <img className={styles.logo} src="/brand/partners-logo-red.png" alt={t('partnersLogoAlt')} />
            </button>
          }
          end={<LanguageSwitch />}
        />
      }
      nav={
        <nav className={styles.navRow} aria-label={t('merchantNav')}>
          <Container width="wide" className={styles.nav}>
            {destinations.map(({ label, path, show }) => (
              <Button
                key={path}
                size="compact"
                prominence={pathname === path ? 'secondary' : 'quiet'}
                {...(pathname === path ? { 'aria-current': 'page' as const } : {})}
                onClick={show}
              >
                {label}
              </Button>
            ))}
          </Container>
        </nav>
      }
    >
      <ScreenOutlet access={access.state} onRetry={access.reload} />
    </AppFrame>
  );
}
