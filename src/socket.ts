// socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;

  socket = io('http://localhost:5001', {
    auth: { token },
    withCredentials: true,
    transports: ['websocket'],
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });

  return socket;
};

export const getSocket = () => socket;

export default {
  connect: connectSocket,
  get: getSocket,
};
