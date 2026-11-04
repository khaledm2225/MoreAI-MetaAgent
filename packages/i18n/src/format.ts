import { tagOf, type Locale } from './locale';

const PIASTERS_PER_POUND = 100;

export interface Formatters {
  /** Takes whole piasters, and never goes through a fraction, so no piaster is ever lost. */
  readonly money: (piasters: number) => string;
  readonly number: (value: number) => string;
  /** On Cairo time, wherever the person is. */
  readonly date: (value: Date) => string;
}

export function createFormatters(locale: Locale): Formatters {
  const tag = tagOf(locale);
  const money = new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'EGP',
    trailingZeroDisplay: 'stripIfInteger',
  });
  const number = new Intl.NumberFormat(tag);
  const date = new Intl.DateTimeFormat(tag, { dateStyle: 'long', timeZone: 'Africa/Cairo' });

  return {
    money: (piasters) => money.format(toDecimalPounds(piasters)),
    number: (value) => number.format(value),
    date: (value) => date.format(value),
  };
}

function toDecimalPounds(piasters: number): Intl.StringNumericLiteral {
  if (!Number.isSafeInteger(piasters)) {
    throw new RangeError(`Money must be whole piasters, but got ${piasters}.`);
  }
  const sign = piasters < 0 ? '-' : '';
  const absolute = Math.abs(piasters);
  const pounds = Math.floor(absolute / PIASTERS_PER_POUND);
  const remainder = String(absolute % PIASTERS_PER_POUND).padStart(2, '0');
  return `${sign}${pounds}.${remainder}` as Intl.StringNumericLiteral;
}
