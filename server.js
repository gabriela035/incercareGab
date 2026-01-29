const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket) => {
  console.log('User connected');

  socket.on('message', (data) => {
    // We receive the JSON string from one tab
    const messagePayload = data.toString();
    
    // We broadcast it to EVERYONE (including the sender)
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(messagePayload);
      }
    });
  });
});

console.log('Server running on ws://localhost:8080');