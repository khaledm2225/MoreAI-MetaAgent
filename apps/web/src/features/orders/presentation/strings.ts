import { defineCatalogs } from '@metaagent/i18n';

export const strings = defineCatalogs(
  {
    title: 'My orders',
    emptyTitle: 'No orders yet',
    emptyBody: 'When you place an order, you can follow it here.',
    askMoreAi: 'Ask MoreAI',
    active: 'Active',
    past: 'Past',
    pieces: { one: '{count} piece', other: '{count} pieces' },
  },
  {
    title: 'أوردراتي',
    emptyTitle: 'لسه مفيش أوردرات',
    emptyBody: 'لما تطلب أوردر، هتقدر تتابعه من هنا.',
    askMoreAi: 'اسأل MoreAI',
    active: 'شغالة',
    past: 'قديمة',
    pieces: { zero: 'مفيش قطع', one: 'قطعة واحدة', two: 'قطعتين', few: '{count} قطع', many: '{count} قطعة', other: '{count} قطعة' },
  },
);
