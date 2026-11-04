import { generatePath } from 'react-router';
import type { Id } from '../core/domain/catalog';
import { routes } from './routes';

export interface AppCoordinator {
  showStart(): void;
  showClientGate(): void;
  showChat(): void;
  showBrowse(): void;
  showSearch(): void;
  showBrand(merchantId: Id): void;
  showProduct(productId: Id): void;
  showPhotoToShop(): void;
  showCart(): void;
  showCheckout(): void;
  showOrders(): void;
  showOrder(orderId: Id): void;
  showRateOrder(orderId: Id): void;
  showAccount(): void;
  showNotifications(): void;
  showSettings(): void;
  showMerchantJoin(): void;
  showMerchantDashboard(): void;
  showMerchantProducts(): void;
  showMerchantAddProduct(): void;
  showMerchantOrders(): void;
  showMerchantShoppers(): void;
  showMerchantCampaigns(): void;
}

/** The one place that decides where the app goes next. Screens only say what happened. */
export function createAppCoordinator(navigate: (path: string) => void): AppCoordinator {
  return {
    showStart: () => navigate(routes.start),
    showClientGate: () => navigate(routes.clientGate),
    showChat: () => navigate(routes.chat),
    showBrowse: () => navigate(routes.browse),
    showSearch: () => navigate(routes.search),
    showBrand: (merchantId) => navigate(generatePath(routes.brand, { merchantId })),
    showProduct: (productId) => navigate(generatePath(routes.product, { productId })),
    showPhotoToShop: () => navigate(routes.photoToShop),
    showCart: () => navigate(routes.cart),
    showCheckout: () => navigate(routes.checkout),
    showOrders: () => navigate(routes.orders),
    showOrder: (orderId) => navigate(generatePath(routes.orderDetails, { orderId })),
    showRateOrder: (orderId) => navigate(generatePath(routes.rateOrder, { orderId })),
    showAccount: () => navigate(routes.account),
    showNotifications: () => navigate(routes.notifications),
    showSettings: () => navigate(routes.settings),
    showMerchantJoin: () => navigate(routes.merchantJoin),
    showMerchantDashboard: () => navigate(routes.merchantDashboard),
    showMerchantProducts: () => navigate(routes.merchantProducts),
    showMerchantAddProduct: () => navigate(routes.merchantAddProduct),
    showMerchantOrders: () => navigate(routes.merchantOrders),
    showMerchantShoppers: () => navigate(routes.merchantShoppers),
    showMerchantCampaigns: () => navigate(routes.merchantCampaigns),
  };
}
