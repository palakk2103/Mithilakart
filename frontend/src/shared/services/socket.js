import { io } from 'socket.io-client';
import { getTokens } from '../api/tokenStorage';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

const sockets = {};

export function getSocket(portal) {
  const { accessToken } = getTokens(portal);
  if (!accessToken) return null;

  const existing = sockets[portal];
  if (existing) {
    existing.auth = { token: accessToken, portal };
    if (!existing.connected) existing.connect();
    return existing;
  }

  const socket = io(SOCKET_URL || undefined, {
    path: '/socket.io',
    auth: { token: accessToken, portal },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  sockets[portal] = socket;
  return socket;
}

export function disconnectSocket(portal) {
  const socket = sockets[portal];
  if (!socket) return;
  socket.disconnect();
  delete sockets[portal];
}
