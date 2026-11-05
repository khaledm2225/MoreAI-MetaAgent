import { Fragment, Suspense, useMemo, useRef, type ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import { LoadingState } from '../core/presentation/LoadStates';
import type { ChatMemory } from '../features/chat';
import { StartScreen } from '../features/start';
import { AppErrorBoundary } from './AppErrorBoundary';
import { ClientShell } from './ClientShell';
import type { AppContainer } from './container';
import { createAppCoordinator } from './coordinator';
import { MerchantShell } from './MerchantShell';
import { routes } from './routes';
import * as screens from './screens';
import { WelcomeShell } from './WelcomeShell';

const showReview = import.meta.env.DEV || import.meta.env.VITE_ENABLE_REVIEW === 'true';

/** Reads one record's id from the address. A new id starts the screen fresh. */
function WithParam({ name, render }: { readonly name: string; readonly render: (id: string) => ReactNode }) {
  const id = useParams()[name];
  return id === undefined ? <Navigate to={routes.start} replace /> : <Fragment key={id}>{render(id)}</Fragment>;
}

export interface AppProps {
  readonly container: AppContainer;
}

/** Joins every screen to its data and to the coordinator. No screen knows about another. */
export function App({ container }: AppProps) {
  const navigate = useNavigate();
  const coordinator = useMemo(() => createAppCoordinator((path) => void navigate(path)), [navigate]);
  const chatMemory = useRef<ChatMemory>({ store: null }).current;
  const { session, catalog, cart, orders, follows, preferences, notifications, settings } = container;
  const { merchantProfile, merchantProducts, merchantOrders } = container;

  const joinAsClient = () =>
    void session.chooseRole('client').then(
      ({ clientGatePassed }) => (clientGatePassed ? coordinator.showChat() : coordinator.showClientGate()),
      coordinator.showClientGate,
    );
  const joinAsMerchant = () =>
    void session.chooseRole('merchant').then(
      ({ merchantId }) => (merchantId === null ? coordinator.showMerchantJoin() : coordinator.showMerchantDashboard()),
      coordinator.showMerchantJoin,
    );

  return (
    <AppErrorBoundary>
    <Routes>
      <Route path={routes.start} element={<StartScreen onJoinAsClient={joinAsClient} onJoinAsMerchant={joinAsMerchant} />} />

      <Route element={<WelcomeShell onLeave={coordinator.showStart} />}>
        <Route path={routes.clientGate} element={<screens.ClientGateScreen session={session} onPassed={coordinator.showChat} onBack={coordinator.showStart} />} />
        <Route path={routes.merchantJoin} element={<screens.MerchantJoinScreen profile={merchantProfile} onAddProducts={coordinator.showMerchantAddProduct} />} />
      </Route>

      <Route element={<ClientShell session={session} cart={cart} settings={settings} coordinator={coordinator} />}>
        <Route path={routes.chat} element={<screens.ChatScreen agent={container.agent} catalog={catalog} onOpenProduct={coordinator.showProduct} onOpenOrders={coordinator.showOrders} onOpenPhotoToShop={coordinator.showPhotoToShop} memory={chatMemory} />} />
        <Route path={routes.browse} element={<screens.BrowseScreen catalog={catalog} onOpenBrand={coordinator.showBrand} onOpenProduct={coordinator.showProduct} />} />
        <Route path={routes.search} element={<screens.SearchScreen search={container.productSearch} catalog={catalog} onOpenProduct={coordinator.showProduct} />} />
        <Route path={routes.brand} element={<WithParam name="merchantId" render={(id) => <screens.BrandScreen merchantId={id} catalog={catalog} follows={follows} onOpenProduct={coordinator.showProduct} />} />} />
        <Route path={routes.product} element={<WithParam name="productId" render={(id) => <screens.ProductScreen productId={id} catalog={catalog} cart={cart} onOpenBrand={coordinator.showBrand} onOpenCart={coordinator.showCart} />} />} />
        <Route path={routes.photoToShop} element={<screens.PhotoToShopScreen gateway={container.photoToShop} onOpenProduct={coordinator.showProduct} />} />
        <Route path={routes.cart} element={<screens.CartScreen cart={cart} onOpenChat={coordinator.showChat} onCheckout={coordinator.showCheckout} />} />
        <Route path={routes.checkout} element={<screens.CheckoutScreen orders={orders} cart={cart} catalog={catalog} onOpenOrders={coordinator.showOrders} onOpenCart={coordinator.showCart} />} />
        <Route path={routes.orders} element={<screens.OrdersScreen orders={orders} onOpenOrder={coordinator.showOrder} onOpenChat={coordinator.showChat} />} />
        <Route path={routes.orderDetails} element={<WithParam name="orderId" render={(id) => <screens.OrderDetailsScreen orderId={id} orders={orders} onRate={coordinator.showRateOrder} />} />} />
        <Route path={routes.rateOrder} element={<WithParam name="orderId" render={(id) => <screens.RateOrderScreen orderId={id} orders={orders} onBack={() => coordinator.showOrder(id)} />} />} />
        <Route path={routes.account} element={<screens.AccountScreen preferences={preferences} onOpenOrders={coordinator.showOrders} onOpenNotifications={coordinator.showNotifications} onOpenSettings={coordinator.showSettings} />} />
        <Route path={routes.notifications} element={<screens.NotificationsScreen notifications={notifications} />} />
        <Route path={routes.settings} element={<screens.SettingsScreen settings={settings} notifications={notifications} session={session} onDeleted={() => { chatMemory.store = null; coordinator.showStart(); }} />} />
      </Route>

      <Route element={<MerchantShell profile={merchantProfile} coordinator={coordinator} />}>
        <Route path={routes.merchantDashboard} element={<screens.MerchantDashboardScreen profile={merchantProfile} orders={merchantOrders} onOpenOrders={coordinator.showMerchantOrders} onAddProduct={coordinator.showMerchantAddProduct} />} />
        <Route path={routes.merchantProducts} element={<screens.MerchantProductsScreen products={merchantProducts} onAdd={coordinator.showMerchantAddProduct} />} />
        <Route path={routes.merchantAddProduct} element={<screens.MerchantAddProductScreen assistant={container.listingAssistant} products={merchantProducts} onSeeProducts={coordinator.showMerchantProducts} />} />
        <Route path={routes.merchantOrders} element={<screens.MerchantOrdersScreen orders={merchantOrders} />} />
        <Route path={routes.merchantShoppers} element={<screens.ShopperHistoryScreen records={container.shopperRecords} />} />
        <Route path={routes.merchantCampaigns} element={<screens.PushCampaignsScreen campaigns={container.campaigns} />} />
      </Route>

      {showReview && <Route path={routes.review} element={<Suspense fallback={<LoadingState />}><screens.ReviewScreen /></Suspense>} />}
      <Route path="*" element={<Navigate to={routes.start} replace />} />
    </Routes>
    </AppErrorBoundary>
  );
}
