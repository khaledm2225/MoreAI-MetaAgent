// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The architecture rules, checked on every test run, so they can't quietly slip.
 * Each failure names the file and the rule it broke.
 */
const SOURCE = dirname(fileURLToPath(import.meta.url));

function allFiles(directory: string): readonly string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });
}

const files = allFiles(SOURCE).filter((file) => file !== fileURLToPath(import.meta.url));
const isTest = (file: string) => /\.test\.tsx?$/.test(file);
const isPreview = (file: string) => /previews?\.tsx?$/.test(file);
const code = files.filter((file) => /\.tsx?$/.test(file));
const app = (file: string) => relative(SOURCE, file);
const areaOf = (file: string) => app(file).split(sep);

function importsOf(file: string): readonly string[] {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/(?:from\s+|import\s+|import\()['"]([^'"]+)['"]/g)].flatMap((match) =>
    match[1] === undefined ? [] : [match[1]],
  );
}

function localTargets(file: string): readonly string[] {
  return importsOf(file)
    .filter((path) => path.startsWith('.'))
    .map((path) => app(resolve(dirname(file), path)));
}

function broken(rule: (file: string) => readonly string[]): readonly string[] {
  return code.filter((file) => !isTest(file)).flatMap(rule);
}

describe('architecture', () => {
  it('no feature imports another feature', () => {
    expect(
      broken((file) => {
        const [area, feature] = areaOf(file);
        if (area !== 'features') {
          return [];
        }
        return localTargets(file)
          .filter((target) => target.startsWith(`features${sep}`) && target.split(sep)[1] !== feature)
          .map((target) => `${app(file)} imports ${target}`);
      }),
    ).toEqual([]);
  });

  it('features and core never reach into the app layer', () => {
    expect(
      broken((file) => {
        const [area] = areaOf(file);
        if (area === 'app' || area === 'main.tsx') {
          return [];
        }
        return localTargets(file)
          .filter((target) => target.startsWith(`app${sep}`))
          .map((target) => `${app(file)} imports ${target}`);
      }),
    ).toEqual([]);
  });

  it('core never depends on a feature', () => {
    expect(
      broken((file) => {
        const [area] = areaOf(file);
        if (area !== 'core') {
          return [];
        }
        return localTargets(file)
          .filter((target) => target.startsWith(`features${sep}`))
          .map((target) => `${app(file)} imports ${target}`);
      }),
    ).toEqual([]);
  });

  it('domain code stays pure: no React, no browser and no outer layers', () => {
    expect(
      broken((file) => {
        const parts = areaOf(file);
        if (!parts.includes('domain')) {
          return [];
        }
        const outer = localTargets(file).filter(
          (target) => target.includes(`${sep}presentation`) || target.includes(`${sep}data`),
        );
        const packages = importsOf(file).filter(
          (path) => !path.startsWith('.') && path !== '@metaagent/i18n',
        );
        const browser = /\b(window|document|localStorage|fetch)\b[.(]/.test(readFileSync(file, 'utf8'))
          ? ['uses a browser API']
          : [];
        return [...outer, ...packages, ...browser].map((problem) => `${app(file)}: ${problem}`);
      }),
    ).toEqual([]);
  });

  it('only the composition root picks a data implementation', () => {
    expect(
      broken((file) => {
        const [area] = areaOf(file);
        if (area === 'app' || area === 'main.tsx' || app(file).includes(`${sep}data${sep}`)) {
          return [];
        }
        return localTargets(file)
          .filter((target) => target.includes(`${sep}data${sep}`) || target.endsWith(`${sep}data`))
          .map((target) => `${app(file)} imports ${target}`);
      }),
    ).toEqual([]);
  });

  it('view models and screens never navigate: the app coordinator does', () => {
    expect(
      broken((file) => {
        const [area] = areaOf(file);
        if (area !== 'features' && area !== 'core') {
          return [];
        }
        const router = importsOf(file).filter((path) => path === 'react-router');
        const location = /\b(window\.location|location\.href|history\.push)\b/.test(readFileSync(file, 'utf8'))
          ? ['changes the location']
          : [];
        return [...router, ...location].map((problem) => `${app(file)}: ${problem}`);
      }),
    ).toEqual([]);
  });

  it('every word on a screen comes from the string catalog', () => {
    expect(
      broken((file) => {
        if (!file.endsWith('.tsx') || isPreview(file) || !areaOf(file).includes('presentation')) {
          return [];
        }
        const source = readFileSync(file, 'utf8');
        const inText = [...source.matchAll(/(?<!=)>\s*([\p{L}][^<>{}=]*?)\s*</gu)].map((match) => match[1] ?? '');
        const inLabels = [...source.matchAll(/\b(?:aria-label|alt|title|placeholder|label)="([^"]+)"/g)].map(
          (match) => match[1] ?? '',
        );
        return [...inText, ...inLabels].map((words) => `${app(file)}: "${words}"`);
      }),
    ).toEqual([]);
  });
});

describe('styles', () => {
  const styles = files.filter((file) => file.endsWith('.css'));

  it.each(styles.map((file) => [app(file), file] as const))('%s only uses design tokens', (_name, file) => {
    const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const problems = [
      ...[...source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) => `raw color ${match[0]}`),
      ...[...source.matchAll(/\brgba?\(|\bhsla?\(/g)].map((match) => `raw color ${match[0]}`),
      ...[...source.matchAll(/cubic-bezier\([^)]*\)/g)].map((match) => `raw curve ${match[0]}`),
      ...[...source.matchAll(/(?<![\w-])\d*\.?\d+m?s\b/g)].map((match) => `raw duration ${match[0]}`),
      ...[...source.matchAll(/(?<![\w-])(\d*\.?\d+)px\b/g)]
        .filter((match) => Number(match[1]) > 3)
        .map((match) => `raw size ${match[0]}`),
    ];
    expect(problems).toEqual([]);
  });
});
