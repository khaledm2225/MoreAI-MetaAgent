import { useCallback, useReducer, useRef } from 'react';
import type { AgentInput } from '../../../core/domain/agent';
import type { Id } from '../../../core/domain/catalog';
import type { Address } from '../../../core/domain/order';
import type { AgentGateway } from '../../../core/domain/ports';
import { chatReducer, initialChatState } from './chatState';

export function useChatViewModel(agent: AgentGateway) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const nextId = useRef(1);

  const run = useCallback(
    async (input: AgentInput, shopperText: string | null) => {
      const id = `sent-${String(nextId.current)}`;
      nextId.current += 1;
      dispatch({ type: 'sent', id, text: shopperText });
      try {
        for await (const event of agent.send(input)) {
          dispatch({ type: 'event', event });
        }
        dispatch({ type: 'finished' });
      } catch {
        dispatch({ type: 'failed' });
      }
    },
    [agent],
  );

  return {
    state,
    sendText: useCallback(
      (text: string) => {
        const trimmed = text.trim();
        if (trimmed !== '') {
          void run({ kind: 'text', text: trimmed }, trimmed);
        }
      },
      [run],
    ),
    chooseVariant: useCallback(
      (productId: Id, variantId: Id) => void run({ kind: 'chooseVariant', productId, variantId }, null),
      [run],
    ),
    answer: useCallback(
      (requestId: Id, accepted: boolean) => {
        dispatch({ type: 'answered', requestId, accepted });
        void run({ kind: 'confirmation', requestId, accepted }, null);
      },
      [run],
    ),
    giveAddress: useCallback(
      (address: Address) => {
        dispatch({ type: 'addressGiven' });
        void run({ kind: 'address', address }, null);
      },
      [run],
    ),
  };
}
