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

  // Connection state is exposed for diagnostics and for E2E tests, which must
  // wait for the seller to have actually joined its room before asserting that
  // an offer arrived — otherwise the test races the handshake.
  socket.on('connect', () => { markConnected(portal, true); });
  socket.on('disconnect', () => { markConnected(portal, false); });

  sockets[portal] = socket;
  return socket;
}

function markConnected(portal, connected) {
  if (typeof window === 'undefined') return;
  window.__socketState = { ...(window.__socketState || {}), [portal]: connected };
  if (portal === 'seller') window.__cr002SocketConnected = connected;
}

export function disconnectSocket(portal) {
  const socket = sockets[portal];
  if (!socket) return;
  socket.disconnect();
  delete sockets[portal];
}
