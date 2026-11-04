import type { Id } from './catalog';
import type { LocalizedText } from './text';

export type ClientRole = 'client' | 'merchant';

export interface Session {
  readonly role: ClientRole | null;
  /** The client saw that MoreAI is an AI and confirmed their age. */
  readonly clientGatePassed: boolean;
  readonly merchantId: Id | null;
  readonly accountDeleted: boolean;
}

export interface AppNotification {
  readonly id: Id;
  readonly merchantId: Id | null;
  readonly merchantName: string | null;
  readonly kind: 'order' | 'marketing';
  readonly title: LocalizedText;
  readonly body: LocalizedText;
  readonly createdAt: Date;
  readonly isRead: boolean;
}

export interface NotificationPreferences {
  readonly marketingConsent: boolean;
  readonly mutedMerchantIds: readonly Id[];
}

export interface AppSettings {
  readonly showMoreAiButton: boolean;
}
