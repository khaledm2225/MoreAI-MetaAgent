import { Badge, Card, Icon, Spinner, Stack, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { TraceStep } from '../../../core/domain/agent';
import styles from './ChatScreen.module.css';
import { strings } from './strings';

/** Shows every model call and tool call as it happens, so a person can see the agent work. */
export function TracePanel({ steps }: { readonly steps: readonly TraceStep[] }) {
  const t = useTranslations(strings);
  const { locale } = useLocale();
  return (
    <Card as="aside" aria-label={t('traceTitle')} className={styles.trace}>
      <Stack gap="xxs">
        <Text role="headline" as="h2">
          {t('traceTitle')}
        </Text>
        <Text role="supporting" tone="secondary">
          {t('traceBody')}
        </Text>
      </Stack>
      {steps.length === 0 ? (
        <Text role="supporting" tone="secondary">
          {t('traceEmpty')}
        </Text>
      ) : (
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li key={step.id} className={styles.step}>
              <div className={styles.stepTop}>
                <Badge tone={step.kind === 'model' ? 'strong' : 'calm'}>
                  <Icon name={step.kind === 'model' ? 'sparkles' : 'activity'} />
                  {step.kind === 'model' ? t('traceModel') : t('traceTool')}
                </Badge>
                <span className={styles.name}>{step.name}</span>
              </div>
              <Text role="supporting">{step.summary[locale]}</Text>
              <div className={styles.status}>
                {step.status === 'running' && <Spinner label={t('traceRunning')} />}
                {step.status === 'done' && <Icon name="check" />}
                {step.status === 'failed' && <Icon name="alert" />}
                <span>
                  {step.status === 'running' && t('traceRunning')}
                  {step.status === 'done' && t('traceDone', { ms: step.durationMs ?? 0 })}
                  {step.status === 'failed' && t('traceFailed')}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
