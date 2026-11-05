import { Button } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { isEnglishOnly } from './languageMode';
import { strings } from './strings';

/** Switches between English and Arabic. It names the other language, in that language. */
export function LanguageSwitch() {
  return isEnglishOnly ? null : <SwitchButton />;
}

function SwitchButton() {
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
