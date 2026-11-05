import type { AgentEvent, ConfirmationRequest, SuggestedPiece, TraceStep } from '../../../core/domain/agent';
import type { Order } from '../../../core/domain/order';
import type { LocalizedText } from '../../../core/domain/text';

export type ChatItem =
  | { readonly kind: 'shopper'; readonly id: string; readonly text: string; readonly photoUrl?: string }
  | { readonly kind: 'assistant'; readonly id: string; readonly text: LocalizedText }
  | { readonly kind: 'suggestions'; readonly id: string; readonly pieces: readonly SuggestedPiece[] }
  | { readonly kind: 'confirm'; readonly id: string; readonly request: ConfirmationRequest; readonly answer: boolean | null }
  | { readonly kind: 'address'; readonly id: string; readonly text: LocalizedText; readonly isOpen: boolean }
  | { readonly kind: 'learned'; readonly id: string; readonly text: LocalizedText }
  | { readonly kind: 'placed'; readonly id: string; readonly orders: readonly Order[] }
  | { readonly kind: 'limit'; readonly id: string; readonly text: LocalizedText };

export interface ChatState {
  readonly items: readonly ChatItem[];
  readonly trace: readonly TraceStep[];
  readonly isThinking: boolean;
  readonly hasFailed: boolean;
}

/** Lives outside the screen, so an answer keeps arriving while the shopper looks at other screens. */
export interface ChatStore {
  readonly getState: () => ChatState;
  readonly subscribe: (listener: () => void) => () => void;
  readonly dispatch: (action: ChatAction) => void;
  readonly nextId: () => string;
}

/** Where the app keeps the conversation's store between visits to the chat. */
export interface ChatMemory {
  store: ChatStore | null;
}

export const initialChatState: ChatState = { items: [], trace: [], isThinking: false, hasFailed: false };

export type ChatAction =
  | { readonly type: 'sent'; readonly id: string; readonly text: string | null; readonly photoUrl?: string }
  | { readonly type: 'event'; readonly event: AgentEvent }
  | { readonly type: 'answered'; readonly requestId: string; readonly accepted: boolean }
  | { readonly type: 'addressGiven' }
  | { readonly type: 'questionsExpired' }
  | { readonly type: 'finished' }
  | { readonly type: 'failed' };

function closeAddressForms(items: readonly ChatItem[]): readonly ChatItem[] {
  return items.map((item) => (item.kind === 'address' ? { ...item, isOpen: false } : item));
}

function applyEvent(state: ChatState, event: AgentEvent): ChatState {
  const add = (item: ChatItem): ChatState => ({ ...state, items: [...state.items, item] });
  switch (event.type) {
    case 'trace': {
      const exists = state.trace.some(({ id }) => id === event.step.id);
      return {
        ...state,
        trace: exists
          ? state.trace.map((step) => (step.id === event.step.id ? event.step : step))
          : [...state.trace, event.step],
      };
    }
    case 'message':
      return add({ kind: 'assistant', id: event.id, text: event.text });
    case 'nothingFits':
      return add({ kind: 'assistant', id: event.id, text: event.text });
    case 'suggestions':
      return add({ kind: 'suggestions', id: event.id, pieces: event.pieces });
    case 'needsAddress':
      return { ...state, items: [...closeAddressForms(state.items), { kind: 'address', id: event.id, text: event.text, isOpen: true }] };
    case 'confirm':
      return add({ kind: 'confirm', id: event.request.id, request: event.request, answer: null });
    case 'preferenceLearned':
      return add({ kind: 'learned', id: event.preference.id, text: event.preference.text });
    case 'orderPlaced':
      return add({ kind: 'placed', id: event.orders[0]?.id ?? 'placed', orders: event.orders });
    case 'limitReached':
      return add({ kind: 'limit', id: `limit-${String(state.items.length)}`, text: event.text });
  }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'sent':
      return {
        ...state,
        isThinking: true,
        hasFailed: false,
        items: action.text === null ? state.items : [...state.items, { kind: 'shopper', id: action.id, text: action.text, ...(action.photoUrl === undefined ? {} : { photoUrl: action.photoUrl }) }],
      };
    case 'event':
      return applyEvent(state, action.event);
    case 'answered':
      return {
        ...state,
        items: state.items.map((item) =>
          item.kind === 'confirm' && item.request.id === action.requestId ? { ...item, answer: action.accepted } : item,
        ),
      };
    case 'questionsExpired':
      return { ...state, items: closeAddressForms(state.items).map((item) => (item.kind === 'confirm' && item.answer === null ? { ...item, answer: false } : item)) };
    case 'addressGiven':
      return { ...state, items: closeAddressForms(state.items) };
    case 'finished':
      return { ...state, isThinking: false };
    case 'failed':
      return { ...state, isThinking: false, hasFailed: true };
  }
}

export function createChatStore(): ChatStore {
  let state = initialChatState;
  let count = 0;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch: (action) => {
      state = chatReducer(state, action);
      for (const listener of listeners) {
        listener();
      }
    },
    nextId: () => {
      count += 1;
      return `sent-${String(count)}`;
    },
  };
}
