import { Badge, Banner, Button, Card, Confetti, PhotoPicker, Stack, Text, TextField } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { useState, type FormEvent } from 'react';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import { strings } from './strings';
import styles from './MerchantJoinScreen.module.css';
import type { JoinState } from './useMerchantJoinViewModel';

export interface MerchantJoinViewProps {
  readonly state: JoinState;
  readonly imageUrl: string | null;
  readonly onPickImage: (file: File) => void;
  readonly onClearImage: () => void;
  readonly onJoin: (name: string, bio: string) => void;
  readonly onAddProducts: () => void;
}

/** A brand's way in: a name, an image and a bio, with products right after. */
export function MerchantJoinView({ state, imageUrl, onPickImage, onClearImage, onJoin, onAddProducts }: MerchantJoinViewProps) {
  const t = useTranslations(strings);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    onJoin(name, bio);
  }

  if (state.kind === 'live') {
    return (
      <ScreenPage title={t('liveTitle')} width="reading">
        <Card>
          <Confetti />
          <Text>{t('liveBody', { brand: state.merchant.name })}</Text>
          <Button icon="plus" onClick={onAddProducts}>
            {t('addProducts')}
          </Button>
        </Card>
      </ScreenPage>
    );
  }
  const problems = state.kind === 'editing' ? state.problems : { name: false, bio: false, image: false };
  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')} width="reading">
      <Card>
        <form noValidate onSubmit={submit}>
          <Stack gap="m">
          <Badge>{t('noLogin')}</Badge>
          <TextField
            label={t('nameLabel')}
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            {...(problems.name ? { error: t('nameError') } : {})}
          />
          <TextField
            label={t('bioLabel')}
            placeholder={t('bioPlaceholder')}
            multiline
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            {...(problems.bio ? { error: t('bioError') } : {})}
          />
          {problems.image && <Banner tone="error">{t('imageError')}</Banner>}
          {imageUrl === null ? (
            <PhotoPicker label={t('imageLabel')} hint={t('imageHint')} onPick={onPickImage} />
          ) : (
            <Stack gap="xs">
              <img className={styles.preview} src={imageUrl} alt={t('imageAlt')} />
              <Button size="compact" prominence="secondary" onClick={onClearImage}>
                {t('changeImage')}
              </Button>
            </Stack>
          )}
          <Text role="supporting" tone="secondary">
            {t('productsNote')}
          </Text>
          {state.kind === 'editing' && state.hasFailed && <Banner tone="error">{t('failed')}</Banner>}
          <Button type="submit" isLoading={state.kind === 'saving'}>
            {t('submit')}
          </Button>
          </Stack>
        </form>
      </Card>
    </ScreenPage>
  );
}
