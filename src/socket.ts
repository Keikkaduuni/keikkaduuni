// socket.ts
import { io } from 'socket.io-client';
import { BACKEND_URL } from './config';

let socket: any = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    socket = io(BACKEND_URL, {
      auth: { token },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  get: getSocket,
  disconnect: disconnectSocket,
};
