import type { Catalog } from '@metaagent/i18n';

export const en = {
  'gallery.title': 'Design system',
  'gallery.switchLanguage': 'العربية',
  'panel.redGround': 'Red ground',
  'panel.page': 'Cream page',
  'panel.buttonsOnRed': 'Every button on the red ground',
  'panel.buttonsOnPage': 'Every button on the cream page',
  'panel.type': 'Type',
  'panel.colors': 'Colors',
  'hero.words': 'Gets your taste',
  'hero.supporting': 'Every local brand in one place.',
  'action.next': 'Next',
  'action.back': 'Back',
  'action.skip': 'Skip',
  'action.main': 'Main action',
  'action.calm': 'Calm action',
  'action.remove': 'Remove',
  'action.snap': 'Snap an outfit',
  'action.unavailable': 'Unavailable',
  'action.loading': 'Loading',
  'action.cancel': 'Cancel',
  'action.confirm': 'Confirm',
  'action.addToCart': 'Add to cart',
  'product.name': 'Black jacket',
  'product.description': 'A calm, relaxed jacket that goes with any outfit.',
  'product.pieces': { one: '{count} piece left', other: '{count} pieces left' },
} as const satisfies Catalog;

export type MessageKey = keyof typeof en;
