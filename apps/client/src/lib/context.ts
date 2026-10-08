import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { Api } from './api';
import type { Profile } from './types';
export const AppContext = createContext<{
  api: Api;
  profile: Profile;
  socket: Socket | null;
  connected: boolean;
  partnerOnline: boolean | null;
  openUs: () => void;
} | null>(null);
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('App context unavailable');
  return value;
}
