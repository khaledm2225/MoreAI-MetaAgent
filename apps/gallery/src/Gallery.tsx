import {
  Badge,
  Banner,
  Bubble,
  Button,
  ButtonStack,
  Card,
  Chip,
  colors,
  Container,
  Dialog,
  Grid,
  Ground,
  IconButton,
  Media,
  Skeleton,
  Spinner,
  Stack,
  Text,
  TextField,
  type GroundKind,
  type TextRole,
} from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import { useState, type ReactNode } from 'react';
import styles from './Gallery.module.css';
import { strings } from './strings';

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
  const t = useTranslations(strings);
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

function Choices() {
  const t = useTranslations(strings);
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
  return (
    <Stack gap="m">
      <Stack direction="row" gap="xs">
        <Chip selected={size === 'S'} onClick={() => setSize('S')}>
          {t('size.small')}
        </Chip>
        <Chip selected={size === 'M'} onClick={() => setSize('M')}>
          {t('size.medium')}
        </Chip>
        <Chip selected={size === 'L'} onClick={() => setSize('L')}>
          {t('size.large')}
        </Chip>
        <Chip selected={false} disabled>
          {t('size.soldOut')}
        </Chip>
      </Stack>
      <Stack direction="row" gap="xs">
        <Badge>{t('badge.brand')}</Badge>
        <Badge tone="strong">{t('badge.new')}</Badge>
      </Stack>
      <Stack direction="row" gap="xs">
        <IconButton icon="plus" label={t('action.add')} prominence="primary" />
        <IconButton icon="minus" label={t('action.remove')} />
        <IconButton icon="close" label={t('action.close')} prominence="quiet" />
      </Stack>
    </Stack>
  );
}

function ConfirmDialog() {
  const t = useTranslations(strings);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon="check" onClick={() => setOpen(true)}>
        {t('action.openDialog')}
      </Button>
      <Dialog
        open={open}
        title={t('dialog.title')}
        onClose={() => setOpen(false)}
        actions={
          <ButtonStack>
            <Button prominence="secondary" onClick={() => setOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={() => setOpen(false)}>{t('action.confirm')}</Button>
          </ButtonStack>
        }
      >
        <Text>{t('dialog.body')}</Text>
      </Dialog>
    </>
  );
}

/** A page for reviewing the design system by eye. It never ships. */
export function Gallery() {
  const t = useTranslations(strings);
  const { locale, setLocale, format } = useLocale();
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

          <Panel name={t('panel.form')}>
            <Ground className={styles.screen}>
              <Card as="form">
                <TextField
                  label={t('form.nameLabel')}
                  placeholder={t('form.namePlaceholder')}
                  hint={t('form.nameHint')}
                />
                <TextField
                  label={t('form.mobileLabel')}
                  type="tel"
                  defaultValue="0100"
                  error={t('form.mobileError')}
                />
                <TextField
                  label={t('form.messageLabel')}
                  placeholder={t('form.messagePlaceholder')}
                  multiline
                />
                <ConfirmDialog />
              </Card>
            </Ground>
          </Panel>

          <Panel name={t('panel.chat')}>
            <Ground className={styles.screen}>
              <Stack gap="s">
                <Bubble from="self">{t('chat.shopper')}</Bubble>
                <Bubble from="other">{t('chat.assistant')}</Bubble>
                <Card as="article">
                  <Media src="/missing-sample-photo.jpg" alt={t('media.jacket')} ratio="landscape" />
                  <Stack direction="row" gap="xs">
                    <Badge>{t('badge.brand')}</Badge>
                  </Stack>
                  <Text role="headline" as="h3">
                    {t('product.name')}
                  </Text>
                  <Text role="supporting" tone="accent" as="p">
                    {format.money(SAMPLE_PRICE_PIASTERS)}
                  </Text>
                </Card>
              </Stack>
            </Ground>
          </Panel>

          <Panel name={t('panel.choices')}>
            <Ground className={styles.screen}>
              <Choices />
            </Ground>
            <Ground kind="plain" className={styles.screen}>
              <Choices />
            </Ground>
          </Panel>

          <Panel name={t('panel.messages')}>
            <Ground className={styles.screen}>
              <Stack gap="s">
                <Banner>{t('message.info')}</Banner>
                <Banner tone="success">{t('message.success')}</Banner>
                <Banner tone="error">{t('message.error')}</Banner>
                <Card>
                  <Spinner label={t('message.loading')} />
                  <Stack gap="xs">
                    <Skeleton shape="block" />
                    <Skeleton />
                    <Skeleton />
                  </Stack>
                </Card>
              </Stack>
            </Ground>
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
