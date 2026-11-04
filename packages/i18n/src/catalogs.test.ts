import { describe, expect, it } from 'vitest';
import { catalogProblems, defineCatalogs } from './catalogs';

describe('defineCatalogs', () => {
  it('keeps both languages together', () => {
    const catalogs = defineCatalogs({ hello: 'Hello' }, { hello: 'أهلا' });
    expect(catalogs.en.hello).toBe('Hello');
    expect(catalogs.ar.hello).toBe('أهلا');
  });
});

describe('catalogProblems', () => {
  it('finds nothing wrong in matching languages', () => {
    const catalogs = defineCatalogs(
      { hello: 'Hello {name}', pieces: { one: '{count} piece', other: '{count} pieces' } },
      {
        hello: 'أهلا {name}',
        pieces: { one: 'قطعة', two: 'قطعتين', few: '{count} قطع', many: '{count} قطعة', other: '{count} قطعة' },
      },
    );
    expect(catalogProblems(catalogs)).toEqual([]);
  });

  it('finds an empty message', () => {
    const catalogs = defineCatalogs({ hello: 'Hello' }, { hello: ' ' });
    expect(catalogProblems(catalogs)).toEqual(['ar: "hello" is empty']);
  });

  it('finds a message that repeats the other language', () => {
    const catalogs = defineCatalogs({ hello: 'Hello' }, { hello: 'Hello' });
    expect(catalogProblems(catalogs)).toEqual(['"hello" is the same in both languages']);
  });

  it('allows a sizes style label that reads the same in both languages', () => {
    const catalogs = defineCatalogs({ small: 'S' }, { small: 'S' });
    expect(catalogProblems(catalogs, { sameInBoth: ['small'] })).toEqual([]);
  });

  it('finds a value only one language uses', () => {
    const catalogs = defineCatalogs({ hello: 'Hello {name}' }, { hello: 'أهلا' });
    expect(catalogProblems(catalogs)).toEqual(['"hello" uses different values: name | (none)']);
  });
});
