import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

type ClientInfo = {
  socket: WebSocket;
  userId: string;
  room: string;
};

const wss = new WebSocketServer({ port: 8080 });
console.log('✅ WebSocket server started on ws://localhost:8080');

const clients = new Map<WebSocket, ClientInfo>();
const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (socket) => {
  const userId = `user-${randomUUID().slice(0, 6)}`;

  socket.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      // Handle room join
      if (parsed.type === 'join' && parsed.room) {
        const room = parsed.room;

        clients.set(socket, { socket, userId, room });

        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room)?.add(socket);

        socket.send(JSON.stringify({
          type: 'system',
          message: `You joined room ${room} as ${userId}`,
          userId
        }));
        return;
      }

      // Handle chat message
      if (parsed.type === 'message' && parsed.message) {
        const info = clients.get(socket);
        if (!info) return;

        const roomClients = rooms.get(info.room);
        if (!roomClients) return;

        const payload = {
          type: 'message',
          from: info.userId,
          message: parsed.message
        };

        roomClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
          }
        });
      }
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  socket.on('close', () => {
    const info = clients.get(socket);
    if (info) {
      rooms.get(info.room)?.delete(socket);
      if (rooms.get(info.room)?.size === 0) {
        rooms.delete(info.room);
      }
      clients.delete(socket);
    }
  });
});
