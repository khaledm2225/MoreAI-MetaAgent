import { createStaticPorts, type AppPorts } from '../core/data/static';

/**
 * The composition root: the one place that picks which implementation each
 * screen gets. Phase 2 replaces the static demo data here with the real calls.
 */
export type AppContainer = AppPorts;

export interface AppContainerOptions {
  /** How long the demo data takes to answer, so loading states are visible. */
  readonly latencyMs?: number;
  readonly clock?: () => Date;
}

const DEMO_LATENCY_MS = 450;

export function createAppContainer({
  latencyMs = DEMO_LATENCY_MS,
  clock = () => new Date(),
}: AppContainerOptions = {}): AppContainer {
  return createStaticPorts({ latencyMs, clock });
}
