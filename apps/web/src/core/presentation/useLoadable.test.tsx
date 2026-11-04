import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLoadable } from './useLoadable';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('useLoadable', () => {
  it('starts loading, then holds the value', async () => {
    const { result } = renderHook(() => useLoadable(() => Promise.resolve('value'), []));
    expect(result.current.state.kind).toBe('loading');
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'loaded', value: 'value' }));
  });

  it('reports a failure', async () => {
    const { result } = renderHook(() => useLoadable(() => Promise.reject(new Error('no')), []));
    await waitFor(() => expect(result.current.state.kind).toBe('failed'));
  });

  it('tries again on reload', async () => {
    const load = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('no')).mockResolvedValue('value');
    const { result } = renderHook(() => useLoadable(load, []));
    await waitFor(() => expect(result.current.state.kind).toBe('failed'));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'loaded', value: 'value' }));
  });

  it('ignores an old answer that arrives after a newer request', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const { result, rerender } = renderHook(({ load, id }) => useLoadable(load, [id]), {
      initialProps: { load: () => first.promise, id: 1 },
    });
    rerender({ load: () => second.promise, id: 2 });
    await act(async () => {
      second.resolve('new');
      await second.promise;
    });
    await act(async () => {
      first.resolve('old');
      await first.promise;
    });
    expect(result.current.state).toEqual({ kind: 'loaded', value: 'new' });
  });

  it('keeps the value on screen during a quiet refresh', async () => {
    const load = vi.fn<() => Promise<string>>().mockResolvedValueOnce('one').mockResolvedValue('two');
    const { result } = renderHook(() => useLoadable(load, []));
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'loaded', value: 'one' }));
    act(() => result.current.refresh());
    expect(result.current.state).toEqual({ kind: 'loaded', value: 'one' });
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'loaded', value: 'two' }));
  });
});
