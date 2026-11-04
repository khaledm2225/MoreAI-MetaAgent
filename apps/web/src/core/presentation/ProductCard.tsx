import { Card, Media, Text } from '@metaagent/design-system';
import { useLocale, useTranslations } from '@metaagent/i18n';
import type { ReactNode } from 'react';
import type { Merchant, Product } from '../domain/catalog';
import { cheapestPriceOf } from '../domain/search';
import styles from './ProductCard.module.css';
import { strings } from './strings';

export interface ProductCardProps {
  readonly product: Product;
  readonly merchant: Merchant;
  /** Why the agent suggested this piece. */
  readonly reason?: string;
  readonly onOpen: () => void;
  /** Wide photos keep what's under the card on screen, as in a chat. */
  readonly compact?: boolean;
  /** Controls under the card, such as size choices. */
  readonly children?: ReactNode;
}

/** One product, in the current language. */
export function ProductCard({ product, merchant, reason, onOpen, compact = false, children }: ProductCardProps) {
  const { locale, format } = useLocale();
  const t = useTranslations(strings);
  const image = product.images[0];
  return (
    <Card as="article">
      <button type="button" className={styles.open} onClick={onOpen}>
        {image !== undefined && <Media src={image.path} alt={image.alt[locale]} ratio={compact ? 'landscape' : 'portrait'} />}
        <span className={styles.details}>
          <Text role="headline" as="span">
            {product.name[locale]}
          </Text>
          <Text role="supporting" tone="secondary" as="span">
            {t('fromBrand', { brand: merchant.name })}
          </Text>
          <Text role="headline" tone="accent" as="span">
            {format.money(cheapestPriceOf(product))}
          </Text>
        </span>
      </button>
      {reason !== undefined && (
        <Text role="supporting" tone="secondary">
          {reason}
        </Text>
      )}
      {children}
    </Card>
  );
}
