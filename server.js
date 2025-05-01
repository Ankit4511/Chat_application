// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = {};
let rooms = { general: [] };

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'join':
        if (users[data.username]) {
          ws.send(JSON.stringify({ type: 'error', message: 'Username already taken.' }));
          return;
        }
        users[data.username] = ws;
        ws.username = data.username;
        ws.room = data.room;
        if (!rooms[ws.room]) rooms[ws.room] = [];
        broadcast(ws.room, {
          type: 'system',
          message: `${data.username} joined the room.`,
        });
        break;

      case 'message':
        const msg = {
          type: 'message',
          username: ws.username,
          message: data.message,
          timestamp: new Date().toLocaleTimeString(),
        };
        rooms[ws.room].push(msg);
        broadcast(ws.room, msg);
        break;

      case 'create-room':
        if (!rooms[data.room]) {
          rooms[data.room] = [];
          broadcastAll({ type: 'rooms', rooms: Object.keys(rooms) });
        }
        break;

      case 'get-rooms':
        ws.send(JSON.stringify({ type: 'rooms', rooms: Object.keys(rooms) }));
        break;
    }
  });

  ws.on('close', () => {
    if (ws.username) {
      delete users[ws.username];
    }
  });
});

function broadcast(room, message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.room === room) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastAll(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

app.use(express.static(path.join(__dirname, 'public')));

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
