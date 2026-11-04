import { Button, Card, EmptyState, Grid, Stack, Text, TextField } from '@metaagent/design-system';
import { useTranslations } from '@metaagent/i18n';
import { useState, type FormEvent } from 'react';
import type { Id } from '../../../core/domain/catalog';
import { LoadingState } from '../../../core/presentation/LoadStates';
import { ProductCard } from '../../../core/presentation/ProductCard';
import { ScreenPage } from '../../../core/presentation/ScreenPage';
import { strings as sharedStrings } from '../../../core/presentation/strings';
import { strings } from './strings';
import type { SearchState } from './useSearchViewModel';

export interface SearchViewProps {
  readonly state: SearchState;
  readonly onSearch: (text: string, budget: string) => void;
  readonly onOpenProduct: (id: Id) => void;
}

export function SearchView({ state, onSearch, onOpenProduct }: SearchViewProps) {
  const t = useTranslations(strings);
  const shared = useTranslations(sharedStrings);
  const [text, setText] = useState('');
  const [budget, setBudget] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    onSearch(text, budget);
  }

  return (
    <ScreenPage title={t('title')} subtitle={t('subtitle')} width="wide">
      <Stack gap="l">
        <Card as="form" role="search" onSubmit={submit}>
          <TextField label={t('queryLabel')} placeholder={t('queryPlaceholder')} value={text} onChange={(event) => setText(event.target.value)} />
          <TextField
            label={t('budgetLabel')}
            placeholder={t('budgetPlaceholder')}
            inputMode="numeric"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            {...(state.kind === 'invalidBudget' ? { error: t('budgetError') } : {})}
          />
          <Button type="submit" icon="search" isLoading={state.kind === 'searching'}>
            {t('search')}
          </Button>
        </Card>
        {state.kind === 'searching' && <LoadingState />}
        {state.kind === 'failed' && <EmptyState icon="alert" title={shared('errorTitle')} body={shared('errorBody')} />}
        {state.kind === 'noResults' && <EmptyState icon="search" title={t('noResultsTitle')} body={t('noResultsBody')} />}
        {state.kind === 'nothingInBudget' && <EmptyState icon="search" title={t('nothingInBudgetTitle')} body={t('nothingInBudgetBody')} />}
        {state.kind === 'results' && (
          <Stack gap="s">
            <Text role="headline" as="h2" aria-live="polite">
              {t('resultsLabel', { count: state.products.length })}
            </Text>
            <Grid itemWidth="compact">
              {state.products.flatMap((product) => {
                const merchant = state.merchants.find(({ id }) => id === product.merchantId);
                return merchant === undefined
                  ? []
                  : [<ProductCard key={product.id} product={product} merchant={merchant} onOpen={() => onOpenProduct(product.id)} />];
              })}
            </Grid>
          </Stack>
        )}
      </Stack>
    </ScreenPage>
  );
}
