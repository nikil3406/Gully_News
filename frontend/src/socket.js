import { io } from "socket.io-client";

const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || "http://localhost:5000";

export const socket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'], // try WebSocket first, fall back to polling
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
