import { Container, Ground } from '@metaagent/design-system';
import { Component, type ReactNode } from 'react';
import { ErrorState } from '../core/presentation/LoadStates';

interface AppErrorBoundaryState {
  readonly hasFailed: boolean;
}

/** If a screen ever breaks, the person gets a way back instead of a blank page. */
export class AppErrorBoundary extends Component<{ readonly children: ReactNode }, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { hasFailed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasFailed: true };
  }

  override render() {
    if (!this.state.hasFailed) {
      return this.props.children;
    }
    return (
      <Ground kind="plain" as="main" fillViewport>
        <Container width="reading">
          <ErrorState onRetry={() => window.location.reload()} />
        </Container>
      </Ground>
    );
  }
}
