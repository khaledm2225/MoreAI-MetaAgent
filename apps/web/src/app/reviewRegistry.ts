import type { ScreenPreviews } from '../core/presentation/preview';
import { accountPreviews } from '../features/account';
import { brandPreviews } from '../features/brand';
import { browsePreviews } from '../features/browse';
import { cartPreviews } from '../features/cart';
import { chatPreviews } from '../features/chat';
import { checkoutPreviews } from '../features/checkout';
import { clientGatePreviews } from '../features/client-gate';
import { merchantAddProductPreviews } from '../features/merchant-add-product';
import { merchantDashboardPreviews } from '../features/merchant-dashboard';
import { merchantJoinPreviews } from '../features/merchant-join';
import { merchantOrdersPreviews } from '../features/merchant-orders';
import { merchantProductsPreviews } from '../features/merchant-products';
import { notificationsPreviews } from '../features/notifications';
import { orderDetailsPreviews } from '../features/order-details';
import { ordersPreviews } from '../features/orders';
import { photoToShopPreviews } from '../features/photo-to-shop';
import { productPreviews } from '../features/product';
import { pushCampaignsPreviews } from '../features/push-campaigns';
import { rateOrderPreviews } from '../features/rate-order';
import { searchPreviews } from '../features/search';
import { settingsPreviews } from '../features/settings';
import { shopperHistoryPreviews } from '../features/shopper-history';
import { startPreviews } from '../features/start';

/** Every state of every screen, for the review page. */
export const reviewRegistry: readonly ScreenPreviews[] = [
  startPreviews,
  clientGatePreviews,
  chatPreviews,
  browsePreviews,
  searchPreviews,
  brandPreviews,
  productPreviews,
  photoToShopPreviews,
  cartPreviews,
  checkoutPreviews,
  ordersPreviews,
  orderDetailsPreviews,
  rateOrderPreviews,
  accountPreviews,
  notificationsPreviews,
  settingsPreviews,
  merchantJoinPreviews,
  merchantDashboardPreviews,
  merchantProductsPreviews,
  merchantAddProductPreviews,
  merchantOrdersPreviews,
  shopperHistoryPreviews,
  pushCampaignsPreviews,
];
