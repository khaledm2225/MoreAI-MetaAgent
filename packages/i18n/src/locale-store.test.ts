import { describe, expect, it } from 'vitest';
import { createMemoryLocaleStore, createWebLocaleStore } from './locale-store';

function fakeStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('createMemoryLocaleStore', () => {
  it('starts empty and remembers', () => {
    const store = createMemoryLocaleStore();
    expect(store.read()).toBeNull();
    store.write('ar');
    expect(store.read()).toBe('ar');
  });
});

describe('createWebLocaleStore', () => {
  it('remembers across instances', () => {
    const storage = fakeStorage();
    createWebLocaleStore(storage).write('en');
    expect(createWebLocaleStore(storage).read()).toBe('en');
  });

  it('ignores a value it does not know', () => {
    const storage = fakeStorage({ 'metaagent.locale': 'fr' });
    expect(createWebLocaleStore(storage).read()).toBeNull();
  });

  it('keeps working when the browser blocks storage', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const store = createWebLocaleStore(blocked);
    expect(store.read()).toBeNull();
    expect(() => store.write('ar')).not.toThrow();
  });

  it('keeps working when the browser has no storage at all', () => {
    const store = createWebLocaleStore(null);
    expect(store.read()).toBeNull();
    expect(() => store.write('ar')).not.toThrow();
  });
});
