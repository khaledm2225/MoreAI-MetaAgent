import type { MerchantOrdersRepository, MerchantProfileRepository } from '../../../core/domain/ports';
import { useEffect } from 'react';
import { useLoadable } from '../../../core/presentation/useLoadable';
import { MerchantDashboardView } from './MerchantDashboardView';

export interface MerchantDashboardScreenProps {
  readonly profile: Pick<MerchantProfileRepository, 'dashboard'>;
  readonly orders: Pick<MerchantOrdersRepository, 'subscribe'>;
  readonly onOpenOrders: () => void;
  readonly onAddProduct: () => void;
}

export function MerchantDashboardScreen({ profile, orders, onOpenOrders, onAddProduct }: MerchantDashboardScreenProps) {
  const { state, reload, refresh } = useLoadable(() => profile.dashboard(), [profile]);
  useEffect(() => orders.subscribe(refresh), [orders, refresh]);
  return <MerchantDashboardView state={state} onRetry={reload} onOpenOrders={onOpenOrders} onAddProduct={onAddProduct} />;
}
