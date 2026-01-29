const { WebSocketServer } = require('ws');

// Start the server on port 8080
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket) => {
  console.log('User connected');

socket.on('message', (data) => {
    const messageString = data.toString(); // This is our JSON string
    
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // Send the JSON string to everyone else
        client.send(messageString);
      }
    });
  });
});

console.log('WebSocket server is running on ws://localhost:8080');