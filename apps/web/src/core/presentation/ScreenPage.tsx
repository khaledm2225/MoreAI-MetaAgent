import { Container, Text, type ContainerWidth } from '@metaagent/design-system';
import type { ReactNode } from 'react';
import styles from './ScreenPage.module.css';

export interface ScreenPageProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly width?: ContainerWidth;
  readonly children: ReactNode;
}

/** A screen's frame: its one main heading, then its content, at a width that suits it. */
export function ScreenPage({ title, subtitle, width = 'regular', children }: ScreenPageProps) {
  return (
    <Container width={width} className={styles.page}>
      <title>{title}</title>
      <div className={styles.header}>
        <Text role="title" as="h1">
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text role="supporting" tone="secondary">
            {subtitle}
          </Text>
        )}
      </div>
      {children}
    </Container>
  );
}
