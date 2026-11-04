import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export type Loadable<T> =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'loaded'; readonly value: T };

export interface LoadableResult<T> {
  readonly state: Loadable<T>;
  /** Shows the loading state and loads again, such as after an error. */
  readonly reload: () => void;
  /** Loads again behind what's on screen, such as after a change elsewhere. */
  readonly refresh: () => void;
}

/** Loads data for a screen. A newer request always wins over an older one. */
export function useLoadable<T>(load: () => Promise<T>, dependencies: DependencyList): LoadableResult<T> {
  const [state, setState] = useState<Loadable<T>>({ kind: 'loading' });
  const latestRequest = useRef(0);
  const latestLoad = useRef(load);
  latestLoad.current = load;

  const run = useCallback(() => {
    latestRequest.current += 1;
    const request = latestRequest.current;
    latestLoad.current().then(
      (value) => {
        if (request === latestRequest.current) {
          setState({ kind: 'loaded', value });
        }
      },
      () => {
        if (request === latestRequest.current) {
          setState({ kind: 'failed' });
        }
      },
    );
  }, []);

  useEffect(() => {
    setState({ kind: 'loading' });
    run();
    return () => {
      latestRequest.current += 1;
    };
    // The caller decides what makes this load again.
  }, dependencies);

  const reload = useCallback(() => {
    setState({ kind: 'loading' });
    run();
  }, [run]);

  return { state, reload, refresh: run };
}
