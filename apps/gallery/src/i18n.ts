import { createI18nContext } from '@metaagent/i18n';
import type { MessageKey } from './strings/en';

export const { I18nProvider, useI18n } = createI18nContext<MessageKey>();
