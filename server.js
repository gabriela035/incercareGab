const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws, req) => {
    const userId = `user_${Date.now()}`;
    let userName = 'Anonymous';
    
    console.log(`New client connected: ${userId}`);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);
            
            switch(data.type) {
                case 'user_join':
                    userName = data.user.name;
                    clients.set(ws, { id: userId, name: userName });
                    console.log(`User ${userName} joined`);
                    break;
                    
                case 'message':
                    const messageData = data.message;
                    console.log(`Message from ${userName} to ${messageData.recipient}: ${messageData.text}`);
                    
                    ws.send(JSON.stringify({
                        type: 'message_delivered',
                        messageId: messageData.id
                    }));
                    
                    broadcast({
                        type: 'message',
                        message: {
                            ...messageData,
                            sender: userName
                        }
                    }, ws);
                    break;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(`Client disconnected: ${userName}`);
        clients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to chat server',
        userId: userId
    }));
});

function broadcast(data, excludeWs = null) {
    const message = JSON.stringify(data);
    
    clients.forEach((user, client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

server.listen(8080, () => {
    console.log('WebSocket server running on ws://localhost:8080');
});