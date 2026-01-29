const { WebSocketServer } = require('ws');

// Start the server on port 8080
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket) => {
  console.log('User connected');

  socket.on('message', (data) => {
    // Broadcast the message to everyone connected
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // 1 means OPEN
        client.send(data.toString());
      }
    });
  });
});

console.log('WebSocket server is running on ws://localhost:8080');