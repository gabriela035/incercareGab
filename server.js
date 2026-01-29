const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket) => {
    // This variable stays attached to this specific socket connection
    let userName = "";

    socket.on('message', (data) => {
        const payload = JSON.parse(data.toString());

        // Capture the name when they join
        if (payload.type === 'join') {
            userName = payload.username;
        }

        // Standard broadcast for all message types (text, join, typing)
        wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(JSON.stringify(payload));
            }
        });
    });

    // Detect when the tab is closed or connection is lost
    socket.on('close', () => {
        if (userName) {
            console.log(`${userName} disconnected`);
            const leavePayload = {
                type: 'system',
                text: `${userName} left the chat`
            };

            // Broadcast to all other users still connected
            wss.clients.forEach((client) => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(leavePayload));
                }
            });
        }
    });
});