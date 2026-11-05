import { useCallback, useState, useSyncExternalStore } from 'react';
import type { AgentInput } from '../../../core/domain/agent';
import type { Id } from '../../../core/domain/catalog';
import type { Address } from '../../../core/domain/order';
import type { AgentGateway } from '../../../core/domain/ports';
import type { PhotoInput } from '../../../core/domain/vision';
import { createChatStore, type ChatMemory } from './chatState';

export function useChatViewModel(agent: Pick<AgentGateway, 'send'>, memory?: ChatMemory) {
  const [store] = useState(() => {
    if (memory === undefined) {
      return createChatStore();
    }
    memory.store ??= createChatStore();
    return memory.store;
  });
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const isBusy = useCallback(() => store.getState().isThinking, [store]);

  const run = useCallback(
    async (input: AgentInput, shopperText: string | null) => {
      const photoUrl = input.kind === 'text' ? input.photo?.previewUrl : undefined;
      store.dispatch({ type: 'sent', id: store.nextId(), text: shopperText, ...(photoUrl === undefined ? {} : { photoUrl }) });
      try {
        for await (const event of agent.send(input)) {
          store.dispatch({ type: 'event', event });
        }
        store.dispatch({ type: 'finished' });
      } catch {
        store.dispatch({ type: 'failed' });
      }
    },
    [agent, store],
  );

  return {
    state,
    sendText: useCallback(
      (text: string, photo?: PhotoInput) => {
        const trimmed = text.trim();
        if (trimmed !== '' && !isBusy()) {
          // Moving on leaves an open question unanswered, and the agent treats it as a no.
          store.dispatch({ type: 'questionsExpired' });
          void run({ kind: 'text', text: trimmed, ...(photo === undefined ? {} : { photo }) }, trimmed);
        }
      },
      [isBusy, run, store],
    ),
    chooseVariant: useCallback(
      (productId: Id, variantId: Id) => {
        if (!isBusy()) {
          store.dispatch({ type: 'questionsExpired' });
          void run({ kind: 'chooseVariant', productId, variantId }, null);
        }
      },
      [isBusy, run, store],
    ),
    answer: useCallback(
      (requestId: Id, accepted: boolean) => {
        if (!isBusy()) {
          store.dispatch({ type: 'answered', requestId, accepted });
          void run({ kind: 'confirmation', requestId, accepted }, null);
        }
      },
      [isBusy, run, store],
    ),
    giveAddress: useCallback(
      (address: Address) => {
        if (!isBusy()) {
          store.dispatch({ type: 'addressGiven' });
          void run({ kind: 'address', address }, null);
        }
      },
      [isBusy, run, store],
    ),
  };
}
