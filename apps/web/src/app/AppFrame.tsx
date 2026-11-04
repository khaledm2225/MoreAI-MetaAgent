import { Badge, Button, Container, Ground } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { Suspense, useEffect, useRef, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ErrorState, LoadingState } from '../core/presentation/LoadStates';
import { strings as sharedStrings } from '../core/presentation/strings';
import type { Loadable } from '../core/presentation/useLoadable';
import styles from './AppFrame.module.css';
import { strings } from './strings';

export interface AppFrameProps {
  readonly bar: ReactNode;
  readonly nav?: ReactNode;
  readonly onLeave: () => void;
  readonly children: ReactNode;
}

/** What every screen after the first sits in: the skip link, the bar, the main area and the demo notice. */
export function AppFrame({ bar, nav, onLeave, children }: AppFrameProps) {
  const t = useTranslations(strings);
  const shared = useTranslations(sharedStrings);
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const isFirstPage = useRef(true);

  useEffect(() => {
    if (isFirstPage.current) {
      isFirstPage.current = false;
      return;
    }
    document.documentElement.scrollTop = 0;
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <Ground kind="plain" fillViewport className={styles.frame}>
      <a className={styles.skip} href="#main">
        {t('skipToContent')}
      </a>
      {bar}
      {nav}
      <main id="main" ref={main} tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <footer>
        <Container width="wide" className={styles.footerInner}>
          <Badge>{shared('demoNotice')}</Badge>
          <Button size="compact" prominence="quiet" icon="arrowBack" onClick={onLeave}>
            {t('backToStart')}
          </Button>
        </Container>
      </footer>
    </Ground>
  );
}

/** The current screen, or what to show while the shell decides whether it may be seen. */
export function ScreenOutlet({ access, onRetry }: { readonly access: Loadable<unknown>; readonly onRetry: () => void }) {
  if (access.kind === 'loading') {
    return <LoadingState />;
  }
  if (access.kind === 'failed') {
    return <ErrorState onRetry={onRetry} />;
  }
  return (
    <Suspense fallback={<LoadingState />}>
      <Outlet />
    </Suspense>
  );
}
