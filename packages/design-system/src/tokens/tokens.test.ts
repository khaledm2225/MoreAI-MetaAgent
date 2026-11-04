// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { colors, layout, motion, radius, spacing, typography } from './index';

const tokensCss = readFileSync(
  fileURLToPath(new URL('../styles/tokens.css', import.meta.url)),
  'utf8',
);

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [red = 0, green = 0, blue = 0] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA_TEXT = 4.5;
const WCAG_AA_LARGE_TEXT = 3;

describe('colors', () => {
  it('uses the brand palette', () => {
    expect(colors.brandGround).toBe('#F50A16');
    expect(colors.background).toBe('#F5ECD6');
    expect(colors.textPrimary).toBe('#1C1412');
    expect(colors.actionFill).toBe('#C8000F');
    expect(colors.tonalFill).toBe('#EBDDBF');
  });

  it.each([
    ['textPrimary on background', colors.textPrimary, colors.background],
    ['textSecondary on background', colors.textSecondary, colors.background],
    ['accentText on background', colors.accentText, colors.background],
    ['danger on background', colors.danger, colors.background],
    ['onAction on actionFill', colors.onAction, colors.actionFill],
    ['textPrimary on tonalFill', colors.textPrimary, colors.tonalFill],
    ['danger on tonalFill', colors.danger, colors.tonalFill],
    ['onBrandAction on brandAction', colors.onBrandAction, colors.brandAction],
    ['onBrandGround on brandTonalFill', colors.onBrandGround, colors.brandTonalFill],
  ])('%s passes AA for text', (_pair, text, fill) => {
    expect(contrast(text, fill)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it('keeps cream on the red ground for large or bold words only', () => {
    expect(contrast(colors.onBrandGround, colors.brandGround)).toBeGreaterThanOrEqual(
      WCAG_AA_LARGE_TEXT,
    );
    expect(contrast(colors.onBrandGround, colors.brandGround)).toBeLessThan(WCAG_AA_TEXT);
  });
});

describe('tokens.css stays in step with the tokens', () => {
  it.each(Object.entries(colors))('color %s', (name, value) => {
    expect(tokensCss).toContain(`--color-${kebab(name)}: ${value};`);
  });

  it.each(Object.entries(spacing))('spacing %s', (name, value) => {
    expect(tokensCss).toContain(`--space-${name}: ${value / 16}rem;`);
  });

  it.each(Object.entries(radius))('radius %s', (name, value) => {
    expect(tokensCss).toContain(`--radius-${name}: ${value / 16}rem;`);
  });

  it('touch target', () => {
    expect(tokensCss).toContain(`--touch-minimum: ${layout.minimumTouchSide / 16}rem;`);
  });

  it.each(Object.entries(layout.contentWidths))('content width %s', (name, value) => {
    expect(tokensCss).toContain(`--content-${name}: ${value / 16}rem;`);
  });

  it.each(Object.entries(typography))('type role %s', (name, role) => {
    expect(tokensCss).toContain(`--type-${kebab(name)}-weight: ${role.weight};`);
    expect(tokensCss).toContain(`--type-${kebab(name)}-family: var(--font-${role.family});`);
    expect(tokensCss).toContain(`--type-${kebab(name)}-size: ${role.size};`);
  });

  it.each(Object.entries(motion))('motion %s', (name, token) => {
    expect(tokensCss).toContain(`--motion-${name}-duration: ${token.durationMs}ms;`);
    expect(tokensCss).toContain(`--motion-${name}-easing: ${token.easing};`);
  });
});

describe('resizing', () => {
  it('sizes nothing in pixels, so a person\'s text size and zoom always apply', () => {
    expect(tokensCss).not.toMatch(/:\s*[\d.]+px;/);
  });

  it.each(Object.entries(typography))('type role %s scales with the person\'s text size', (_name, role) => {
    expect(role.size).toContain('rem');
  });

  it.each(Object.entries(typography))('type role %s can still double when zoomed', (_name, role) => {
    const fluid = /^clamp\(([\d.]+)rem, .+, ([\d.]+)rem\)$/.exec(role.size);
    if (fluid !== null) {
      expect(Number(fluid[2])).toBeGreaterThanOrEqual(2 * Number(fluid[1]));
    }
  });
});

describe('motion', () => {
  it('tightens the bouncy motion into the plain one under reduced motion', () => {
    const reduced = tokensCss.slice(tokensCss.indexOf('prefers-reduced-motion'));
    expect(reduced).toContain('--motion-pop-duration: var(--motion-quick-duration);');
    expect(reduced).toContain('--motion-pop-easing: var(--motion-quick-easing);');
  });
});
