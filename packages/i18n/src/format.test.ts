import { describe, expect, it } from 'vitest';
import { createFormatters } from './format';

// The browser keeps a price on one line with a non breaking space.
const NBSP = '\u00A0';
const english = createFormatters('en');
const arabic = createFormatters('ar');

describe('money', () => {
  it('shows a whole amount without decimals', () => {
    expect(english.money(50_000)).toBe(`EGP${NBSP}500`);
    expect(arabic.money(50_000)).toContain('500');
    expect(arabic.money(50_000)).toContain('ج.م');
  });

  it('shows piasters exactly', () => {
    expect(english.money(125_050)).toBe(`EGP${NBSP}1,250.50`);
    expect(english.money(5)).toBe(`EGP${NBSP}0.05`);
    expect(english.money(19_999)).toBe(`EGP${NBSP}199.99`);
  });

  it('never loses a piaster on a large amount', () => {
    expect(english.money(900_719_925_474_099)).toBe(`EGP${NBSP}9,007,199,254,740.99`);
  });

  it('keeps the sign of a refund', () => {
    expect(english.money(-150)).toBe(`-EGP${NBSP}1.50`);
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])('refuses %s piasters', (value) => {
    expect(() => english.money(value)).toThrow('piasters');
  });
});

describe('number', () => {
  it('uses Latin digits in both languages', () => {
    expect(english.number(1200)).toBe('1,200');
    expect(arabic.number(1200)).toBe('1,200');
  });
});

describe('date', () => {
  const moment = new Date('2026-11-05T01:00:00+02:00');

  it('writes the date for each language, on Cairo time', () => {
    expect(english.date(moment)).toBe('November 5, 2026');
    expect(arabic.date(moment)).toContain('2026');
    expect(arabic.date(moment)).toContain('نوفمبر');
  });
});
