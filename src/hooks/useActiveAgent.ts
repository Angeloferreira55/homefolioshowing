import { useContext } from 'react';
import { ActiveAgentContext } from '@/contexts/ActiveAgentContext';

export function useActiveAgent() {
  return useContext(ActiveAgentContext);
}
