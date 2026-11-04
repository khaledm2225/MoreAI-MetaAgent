import {
  Button,
  ButtonStack,
  colors,
  Container,
  Grid,
  Ground,
  Stack,
  Text,
  type GroundKind,
  type TextRole,
} from '@metaagent/design-system';
import type { ReactNode } from 'react';
import styles from './Gallery.module.css';
import { useI18n } from './i18n';

const SAMPLE_PRICE_PIASTERS = 50_000;
const SAMPLE_PIECES_LEFT = 3;

const headingRoles: readonly TextRole[] = ['display', 'title', 'section', 'headline'];
const readingRoles: readonly TextRole[] = ['body', 'supporting', 'label', 'caption'];

function Panel({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <Text role="label" tone="secondary" as="h2">
        {name}
      </Text>
      {children}
    </section>
  );
}

function EveryButton({ kind }: { kind: GroundKind }) {
  const { t } = useI18n();
  return (
    <Ground kind={kind} className={styles.screen}>
      <Stack gap="s">
        <Button>{t('action.main')}</Button>
        <Button prominence="secondary">{t('action.calm')}</Button>
        <Button prominence="quiet">{t('action.skip')}</Button>
        <Button prominence="destructive">{t('action.remove')}</Button>
        <Button icon="camera">{t('action.snap')}</Button>
        <Button icon="arrowForward">{t('action.next')}</Button>
        <Button disabled>{t('action.unavailable')}</Button>
        <Button isLoading>{t('action.loading')}</Button>
        <ButtonStack>
          <Button prominence="secondary">{t('action.back')}</Button>
          <Button>{t('action.next')}</Button>
        </ButtonStack>
        <ButtonStack widths="hugging">
          <Button size="compact" prominence="secondary" icon="close">
            {t('action.cancel')}
          </Button>
          <Button>{t('action.confirm')}</Button>
        </ButtonStack>
      </Stack>
    </Ground>
  );
}

/** A page for reviewing the design system by eye. It never ships. */
export function Gallery() {
  const { t, locale, setLocale, format } = useI18n();
  return (
    <Ground kind="plain" as="main" fillViewport className={styles.page}>
      <Container width="wide">
        <Stack direction="row" className={styles.header}>
          <Text role="title" as="h1">
            {t('gallery.title')}
          </Text>
          <Button
            size="compact"
            prominence="secondary"
            icon="languages"
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          >
            {t('gallery.switchLanguage')}
          </Button>
        </Stack>

        <Grid gap="l">
          <Panel name={t('panel.redGround')}>
            <Ground className={`${styles.screen} ${styles.hero}`}>
              <Text role="hero" as="p">
                {t('hero.words')}
              </Text>
              <Stack gap="s" className={styles.push}>
                <Text role="headline" as="p">
                  {t('hero.supporting')}
                </Text>
                <Button icon="arrowForward">{t('action.next')}</Button>
                <Button prominence="quiet">{t('action.skip')}</Button>
              </Stack>
            </Ground>
          </Panel>

          <Panel name={t('panel.page')}>
            <Ground kind="plain" className={styles.screen}>
              <div className={styles.photo} />
              <Text role="title" as="h3">
                {t('product.name')}
              </Text>
              <Text role="section" tone="accent" as="p">
                {format.money(SAMPLE_PRICE_PIASTERS)}
              </Text>
              <Text role="supporting" tone="secondary">
                {t('product.description')}
              </Text>
              <Text role="label" tone="secondary" as="p">
                {t('product.pieces', { count: SAMPLE_PIECES_LEFT })}
              </Text>
              <Stack gap="s" className={styles.push}>
                <Button icon="bag">{t('action.addToCart')}</Button>
                <Button prominence="secondary">{t('action.next')}</Button>
              </Stack>
            </Ground>
          </Panel>

          <Panel name={t('panel.buttonsOnRed')}>
            <EveryButton kind="brand" />
          </Panel>

          <Panel name={t('panel.buttonsOnPage')}>
            <EveryButton kind="plain" />
          </Panel>

          <Panel name={t('panel.type')}>
            <Ground kind="plain" className={styles.screen}>
              <Stack gap="s">
                {headingRoles.map((role) => (
                  <Text key={role} role={role} as="div">
                    {t('hero.words')}
                  </Text>
                ))}
                {readingRoles.map((role) => (
                  <Text key={role} role={role} as="div">
                    {t('hero.supporting')}
                  </Text>
                ))}
              </Stack>
            </Ground>
          </Panel>

          <Panel name={t('panel.colors')}>
            <Ground kind="plain" className={styles.screen}>
              <div className={styles.swatches}>
                {Object.entries(colors).map(([name, value]) => (
                  <Stack key={name} gap="xxs">
                    <div className={styles.chip} style={{ background: value }} />
                    <Text role="caption" tone="secondary" as="div" className={styles.code}>
                      {name}
                    </Text>
                    <Text role="caption" as="div" className={styles.code}>
                      {value}
                    </Text>
                  </Stack>
                ))}
              </div>
            </Ground>
          </Panel>
        </Grid>
      </Container>
    </Ground>
  );
}
