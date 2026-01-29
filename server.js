const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket) => {
  socket.on('message', (data) => {
    const messagePayload = data.toString();
    
    // Simply broadcast every message received to all connected tabs
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(messagePayload);
      }
    });
  });
});

console.log('Server running on ws://localhost:8080');