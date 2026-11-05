import { useEffect, useState } from 'react';
import type { Id, Size } from '../../../core/domain/catalog';
import type { AgentGateway, CatalogRepository } from '../../../core/domain/ports';
import type { ChatMemory } from './chatState';
import { ChatView } from './ChatView';
import { useChatViewModel } from './useChatViewModel';

export interface ChatScreenProps {
  readonly agent: Pick<AgentGateway, 'send'>;
  readonly catalog: Pick<CatalogRepository, 'listSizes'>;
  readonly onOpenProduct: (productId: Id) => void;
  readonly onOpenOrders: () => void;
  readonly onOpenPhotoToShop: () => void;
  /** Keeps the conversation when the shopper leaves this screen and comes back. */
  readonly memory?: ChatMemory;
}

/** The heart of the product: the agent guides the client all the way to a placed order. */
export function ChatScreen({ agent, catalog, onOpenProduct, onOpenOrders, onOpenPhotoToShop, memory }: ChatScreenProps) {
  const { state, sendText, chooseVariant, answer, giveAddress } = useChatViewModel(agent, memory);
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
      createPhotoUrl={(file) => URL.createObjectURL(file)}
      onChooseVariant={chooseVariant}
      onAnswer={answer}
      onGiveAddress={giveAddress}
      onOpenProduct={onOpenProduct}
      onOpenOrders={onOpenOrders}
      onOpenPhotoToShop={onOpenPhotoToShop}
    />
  );
}
