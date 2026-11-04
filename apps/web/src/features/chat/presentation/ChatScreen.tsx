import { useEffect, useState } from 'react';
import type { Id, Size } from '../../../core/domain/catalog';
import type { AgentGateway, CatalogRepository } from '../../../core/domain/ports';
import { ChatView } from './ChatView';
import { useChatViewModel } from './useChatViewModel';

export interface ChatScreenProps {
  readonly agent: AgentGateway;
  readonly catalog: Pick<CatalogRepository, 'listSizes'>;
  readonly onOpenProduct: (productId: Id) => void;
  readonly onOpenOrders: () => void;
  readonly onOpenPhotoToShop: () => void;
}

/** The heart of the product: the agent guides the client all the way to a placed order. */
export function ChatScreen({ agent, catalog, onOpenProduct, onOpenOrders, onOpenPhotoToShop }: ChatScreenProps) {
  const { state, sendText, chooseVariant, answer, giveAddress } = useChatViewModel(agent);
  const [sizes, setSizes] = useState<readonly Size[]>([]);

  useEffect(() => {
    let isCurrent = true;
    catalog.listSizes().then(
      (loaded) => {
        if (isCurrent) {
          setSizes(loaded);
        }
      },
      () => {},
    );
    return () => {
      isCurrent = false;
    };
  }, [catalog]);

  return (
    <ChatView
      state={state}
      sizeLabelOf={(sizeId) => sizes.find(({ id }) => id === sizeId)?.label ?? ''}
      onSend={sendText}
      onChooseVariant={chooseVariant}
      onAnswer={answer}
      onGiveAddress={giveAddress}
      onOpenProduct={onOpenProduct}
      onOpenOrders={onOpenOrders}
      onOpenPhotoToShop={onOpenPhotoToShop}
    />
  );
}
