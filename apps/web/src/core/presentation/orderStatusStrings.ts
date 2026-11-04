import { defineCatalogs } from '@metaagent/i18n';

/** What every order status is called, on both the client's side and the brand's. */
export const orderStatusStrings = defineCatalogs(
  {
    PLACED: 'Placed',
    ACCEPTED: 'Accepted',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    NOT_DELIVERED: 'Not delivered',
  },
  {
    PLACED: 'اتطلب',
    ACCEPTED: 'اتقبل',
    OUT_FOR_DELIVERY: 'خرج للتوصيل',
    DELIVERED: 'اتوصل',
    REJECTED: 'اترفض',
    CANCELLED: 'اتلغى',
    NOT_DELIVERED: 'ماتوصلش',
  },
);
