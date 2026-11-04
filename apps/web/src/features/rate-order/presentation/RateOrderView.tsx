import { Banner, Button, Card, EmptyState, RatingStars, Stack, Text, TextField } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { useState, type FormEvent } from 'react';
import { canRateOrder, type Order } from '../../../core/domain/order';
import { ErrorState, LoadingState } from '../../../core/presentation/LoadStates';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import type { Loadable } from '../../../core/presentation/useLoadable';
import { strings } from './strings';
import type { SubmitState } from './useRateOrderViewModel';

export interface RateOrderViewProps {
  readonly state: Loadable<Order | null>;
  readonly submit: SubmitState;
  readonly onRetry: () => void;
  readonly onSend: (stars: number, comment: string) => void;
  readonly onBack: () => void;
}

export function RateOrderView({ state, submit, onRetry, onSend, onBack }: RateOrderViewProps) {
  const t = useTranslations(strings);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  function send(event: FormEvent) {
    event.preventDefault();
    if (stars > 0) {
      onSend(stars, comment);
    }
  }

  const back = (
    <Button size="compact" prominence="secondary" onClick={onBack}>
      {t('back')}
    </Button>
  );

  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')} width="reading">
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'failed' && <ErrorState onRetry={onRetry} />}
      {state.kind === 'loaded' && state.value === null && <EmptyState icon="package" title={t('notFound')} action={back} />}
      {state.kind === 'loaded' && state.value !== null && state.value.rating !== null && (
        <EmptyState icon="star" title={t('alreadyTitle')} body={t('alreadyBody')} action={back} />
      )}
      {state.kind === 'loaded' && state.value !== null && state.value.rating === null && !canRateOrder(state.value) && (
        <EmptyState icon="package" title={t('notReadyTitle')} body={t('notReadyBody')} action={back} />
      )}
      {state.kind === 'loaded' && state.value !== null && canRateOrder(state.value) && (
        <Card as="form" onSubmit={send}>
          <Stack gap="m">
            <Text role="headline" as="h2">
              {state.value.merchantName}
            </Text>
            <RatingStars value={stars} label={t('stars')} optionLabels={[t('one'), t('two'), t('three'), t('four'), t('five')]} onChange={setStars} />
            <TextField label={t('comment')} multiline value={comment} onChange={(event) => setComment(event.target.value)} />
            {submit === 'failed' && <Banner tone="error">{t('failed')}</Banner>}
            <Button type="submit" disabled={stars === 0} isLoading={submit === 'sending'}>
              {stars === 0 ? t('chooseFirst') : t('submit')}
            </Button>
          </Stack>
        </Card>
      )}
    </ScreenPage>
  );
}
