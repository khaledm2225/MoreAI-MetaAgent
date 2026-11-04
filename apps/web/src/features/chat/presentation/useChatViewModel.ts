import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { AgentInput } from '../../../core/domain/agent';
import type { Id } from '../../../core/domain/catalog';
import type { Address } from '../../../core/domain/order';
import type { AgentGateway } from '../../../core/domain/ports';
import type { PhotoInput } from '../../../core/domain/vision';
import { chatReducer, initialChatState, type ChatMemory } from './chatState';

export function useChatViewModel(agent: AgentGateway, memory?: ChatMemory) {
  const [state, dispatch] = useReducer(chatReducer, memory?.state === null || memory?.state === undefined ? initialChatState : { ...memory.state, isThinking: false });

  useEffect(() => {
    if (memory !== undefined) {
      memory.state = state;
    }
  }, [memory, state]);
  const nextId = useRef(1);

  const run = useCallback(
    async (input: AgentInput, shopperText: string | null) => {
      const id = `sent-${String(nextId.current)}`;
      nextId.current += 1;
      const photoUrl = input.kind === 'text' ? input.photo?.previewUrl : undefined;
      dispatch({ type: 'sent', id, text: shopperText, ...(photoUrl === undefined ? {} : { photoUrl }) });
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
      (text: string, photo?: PhotoInput) => {
        const trimmed = text.trim();
        if (trimmed !== '') {
          void run({ kind: 'text', text: trimmed, ...(photo === undefined ? {} : { photo }) }, trimmed);
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
