import { Button } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { strings } from './strings';

/** Switches between English and Arabic. It names the other language, in that language. */
export function LanguageSwitch() {
  const t = useTranslations(strings);
  const { locale, setLocale } = useLocale();
  return (
    <Button
      size="compact"
      prominence="secondary"
      icon="languages"
      onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
    >
      {t('switchToOtherLanguage')}
    </Button>
  );
}
