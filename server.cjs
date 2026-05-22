const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Store active connections grouped by roomCode
// Map<roomCode, Set<WebSocket>>
const rooms = new Map();

wss.on('connection', (ws) => {
  let clientRoom = null;
  let clientId = null;
  let clientRole = null;

  console.log('[WS Server] New connection established.');

  ws.on('message', (message) => {
    try {
      // Decode Buffer or array to string
      let messageStr;
      if (Buffer.isBuffer(message)) {
        messageStr = message.toString('utf-8');
      } else if (typeof message === 'string') {
        messageStr = message;
      } else {
        messageStr = message.toString();
      }

      const data = JSON.parse(messageStr);
      const { type, roomCode, role, playerId, payload, senderId } = data;

      console.log(`[WS Receive] Type: ${type}, Room: ${roomCode || clientRoom}, Sender: ${senderId || playerId || clientId}`);

      if (type === 'REGISTER') {
        clientRoom = roomCode;
        clientId = playerId;
        clientRole = role;

        if (!rooms.has(roomCode)) {
          rooms.set(roomCode, new Set());
        }
        rooms.get(roomCode).add(ws);
        console.log(`[WS Register] Registered: Room ${roomCode}, Role ${role}, ID ${playerId}`);
        return;
      }

      // Relay all other messages to other clients in the same room
      const targetRoom = roomCode || clientRoom;
      if (targetRoom && rooms.has(targetRoom)) {
        const clients = rooms.get(targetRoom);
        const msgToSend = JSON.stringify({
          type,
          payload,
          senderId: senderId || clientId
        });

        let relayCount = 0;
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(msgToSend);
            relayCount++;
          }
        });
        console.log(`[WS Relay] Relayed ${type} from ${senderId || clientId} to ${relayCount} other client(s) in Room ${targetRoom}`);
      } else {
        console.log(`[WS Warning] Target room "${targetRoom}" not found or empty for message type ${type}`);
      }
    } catch (err) {
      console.error('[WS Error] Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS Server] Connection closed. Room: ${clientRoom}, ID: ${clientId}`);
    if (clientRoom && rooms.has(clientRoom)) {
      const clients = rooms.get(clientRoom);
      clients.delete(ws);
      if (clients.size === 0) {
        rooms.delete(clientRoom);
        console.log(`[WS Room] Room ${clientRoom} deleted (empty)`);
      } else {
        console.log(`[WS Room] Client disconnected from Room ${clientRoom}. Remaining: ${clients.size}`);
      }
    }
  });
});

// Upgrade HTTP connection to WebSocket on /ws (safe pathname parsing)
server.on('upgrade', (request, socket, head) => {
  const pathname = request.url ? request.url.split('?')[0] : '';

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Serve static files from Vite build folder 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for React routing
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
