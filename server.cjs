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

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, roomCode, role, playerId, payload, senderId } = data;

      if (type === 'REGISTER') {
        clientRoom = roomCode;
        clientId = playerId;
        clientRole = role;

        if (!rooms.has(roomCode)) {
          rooms.set(roomCode, new Set());
        }
        rooms.get(roomCode).add(ws);
        console.log(`Client registered: Room ${roomCode}, Role ${role}, ID ${playerId}`);
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

        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(msgToSend);
          }
        });
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (clientRoom && rooms.has(clientRoom)) {
      const clients = rooms.get(clientRoom);
      clients.delete(ws);
      if (clients.size === 0) {
        rooms.delete(clientRoom);
        console.log(`Room ${clientRoom} deleted (empty)`);
      } else {
        console.log(`Client disconnected from Room ${clientRoom}. Remaining clients: ${clients.size}`);
      }
    }
  });
});

// Upgrade HTTP connection to WebSocket on /ws
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

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
