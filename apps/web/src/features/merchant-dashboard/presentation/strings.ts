import { defineCatalogs } from '@metaagent/i18n';

export const strings = defineCatalogs(
  {
    title: 'Dashboard',
    freeOrders: 'Free orders',
    freeOrdersText: { one: '{count} free order left, of your first 100', other: '{count} free orders left, of your first 100' },
    noFeesBody: 'No fees for your first 100 orders.',
    todayTitle: 'Today’s orders',
    noOrdersTitle: 'No orders yet',
    noOrdersBody: 'When a shopper orders your pieces, you’ll see it here.',
    openOrders: 'Open orders',
    addProduct: 'Add a product',
  },
  {
    title: 'لوحة التحكم',
    freeOrders: 'الأوردرات المجانية',
    freeOrdersText: {
      zero: 'خلصت الأوردرات المجانية من أول 100',
      one: 'فاضل أوردر مجاني واحد من أول 100',
      two: 'فاضل أوردرين مجانيين من أول 100',
      few: 'فاضل {count} أوردرات مجانية من أول 100',
      many: 'فاضل {count} أوردر مجاني من أول 100',
      other: 'فاضل {count} أوردر مجاني من أول 100',
    },
    noFeesBody: 'من غير رسوم لأول 100 أوردر.',
    todayTitle: 'أوردرات النهارده',
    noOrdersTitle: 'لسه مفيش أوردرات',
    noOrdersBody: 'لما عميل يطلب قطعك، هتشوفها هنا.',
    openOrders: 'افتح الأوردرات',
    addProduct: 'ضيف منتج',
  },
);
