import { lazy as reactLazy, type ComponentType } from 'react';

const RELOADED = 'moreai.reloaded-for-new-version';

/** Site data can be blocked in a private window, and that must never break a screen. */
function attempt<T>(work: () => T): T | undefined {
  try {
    return work();
  } catch {
    return undefined;
  }
}

/** After a new version goes live, an open page may ask for files that no longer exist. Reloading once fixes it. */
function lazy<Screen extends ComponentType<any>>(load: () => Promise<{ default: Screen }>) {
  return reactLazy(() =>
    load().then(
      (loaded) => {
        attempt(() => sessionStorage.removeItem(RELOADED));
        return loaded;
      },
      (error: unknown) => {
        if (attempt(() => sessionStorage.getItem(RELOADED) === null) === true) {
          attempt(() => sessionStorage.setItem(RELOADED, '1'));
          window.location.reload();
          return new Promise<never>(() => {});
        }
        throw error;
      },
    ),
  );
}

/** Each screen loads when it's first opened, so the first screen stays light. */
export const ClientGateScreen = lazy(() => import('../features/client-gate').then((m) => ({ default: m.ClientGateScreen })));
export const ChatScreen = lazy(() => import('../features/chat').then((m) => ({ default: m.ChatScreen })));
export const BrowseScreen = lazy(() => import('../features/browse').then((m) => ({ default: m.BrowseScreen })));
export const SearchScreen = lazy(() => import('../features/search').then((m) => ({ default: m.SearchScreen })));
export const BrandScreen = lazy(() => import('../features/brand').then((m) => ({ default: m.BrandScreen })));
export const ProductScreen = lazy(() => import('../features/product').then((m) => ({ default: m.ProductScreen })));
export const PhotoToShopScreen = lazy(() => import('../features/photo-to-shop').then((m) => ({ default: m.PhotoToShopScreen })));
export const CartScreen = lazy(() => import('../features/cart').then((m) => ({ default: m.CartScreen })));
export const CheckoutScreen = lazy(() => import('../features/checkout').then((m) => ({ default: m.CheckoutScreen })));
export const OrdersScreen = lazy(() => import('../features/orders').then((m) => ({ default: m.OrdersScreen })));
export const OrderDetailsScreen = lazy(() => import('../features/order-details').then((m) => ({ default: m.OrderDetailsScreen })));
export const RateOrderScreen = lazy(() => import('../features/rate-order').then((m) => ({ default: m.RateOrderScreen })));
export const AccountScreen = lazy(() => import('../features/account').then((m) => ({ default: m.AccountScreen })));
export const NotificationsScreen = lazy(() => import('../features/notifications').then((m) => ({ default: m.NotificationsScreen })));
export const SettingsScreen = lazy(() => import('../features/settings').then((m) => ({ default: m.SettingsScreen })));
export const MerchantJoinScreen = lazy(() => import('../features/merchant-join').then((m) => ({ default: m.MerchantJoinScreen })));
export const MerchantDashboardScreen = lazy(() => import('../features/merchant-dashboard').then((m) => ({ default: m.MerchantDashboardScreen })));
export const MerchantProductsScreen = lazy(() => import('../features/merchant-products').then((m) => ({ default: m.MerchantProductsScreen })));
export const MerchantAddProductScreen = lazy(() => import('../features/merchant-add-product').then((m) => ({ default: m.MerchantAddProductScreen })));
export const MerchantOrdersScreen = lazy(() => import('../features/merchant-orders').then((m) => ({ default: m.MerchantOrdersScreen })));
export const ShopperHistoryScreen = lazy(() => import('../features/shopper-history').then((m) => ({ default: m.ShopperHistoryScreen })));
export const PushCampaignsScreen = lazy(() => import('../features/push-campaigns').then((m) => ({ default: m.PushCampaignsScreen })));
export const ReviewScreen = lazy(() => import('./ReviewScreen').then((m) => ({ default: m.ReviewScreen })));
