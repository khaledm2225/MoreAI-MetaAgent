import { useCallback, useState } from 'react';
import type { SessionRepository } from '../../../core/domain/ports';

export type ClientGateState = 'asking' | 'saving' | 'failed' | 'underAge';

export function useClientGateViewModel(session: SessionRepository, onPassed: () => void) {
  const [state, setState] = useState<ClientGateState>('asking');

  const confirmAdult = useCallback(() => {
    setState('saving');
    session.passClientGate().then(onPassed, () => setState('failed'));
  }, [session, onPassed]);

  const confirmMinor = useCallback(() => setState('underAge'), []);

  return { state, confirmAdult, confirmMinor };
}
