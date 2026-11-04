import type { SessionRepository } from '../../../core/domain/ports';
import { ClientGateView } from './ClientGateView';
import { useClientGateViewModel } from './useClientGateViewModel';

export interface ClientGateScreenProps {
  readonly session: SessionRepository;
  readonly onPassed: () => void;
  readonly onBack: () => void;
}

/** Says clearly that MoreAI is an AI, and checks the client's age. */
export function ClientGateScreen({ session, onPassed, onBack }: ClientGateScreenProps) {
  const { state, confirmAdult, confirmMinor } = useClientGateViewModel(session, onPassed);
  return <ClientGateView state={state} onConfirmAdult={confirmAdult} onConfirmMinor={confirmMinor} onBack={onBack} />;
}
