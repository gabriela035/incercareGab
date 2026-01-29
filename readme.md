To implement a basic texting feature, we will use a **Node.js** server with the `ws` library. This is the simplest way to get a real-time connection running without the overhead of heavy frameworks.

### 1. The Server (Node.js)

First, create a folder for your project. Inside that folder, run `npm init -y` and `npm install ws`. Then, create a file named `server.js`:

```javascript
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

```

---

### 2. The Frontend (script.js)

We need to connect your existing HTML to this server. We'll grab the input field and the send button, then append a new message to the chat window whenever one is received.

```javascript
const socket = new WebSocket('ws://localhost:8080');

const messageInput = document.querySelector('.chat-input-area input');
const sendButton = document.querySelector('.send-button');
const chatMessages = document.querySelector('.chat-messages');

// 1. Send message when button is clicked
sendButton.addEventListener('click', () => {
  const message = messageInput.value;
  if (message) {
    socket.send(message); // Send to server
    messageInput.value = ''; // Clear input
  }
});

// 2. Receive message from server and show it
socket.onmessage = (event) => {
  const newMessage = document.createElement('div');
  
  // Basic styling using your existing CSS classes
  newMessage.className = 'message-group incoming'; 
  newMessage.innerHTML = `
    <div class="message-content">
      <div class="message-bubble">
        <p>${event.data}</p>
      </div>
    </div>
  `;
  
  chatMessages.appendChild(newMessage);
  
  // Auto-scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

```

---

### 3. How to run it

1. **Start the Server:** In your terminal, run `node server.js`.
2. **Open the App:** Open your `index.html` in a browser.
3. **Test it:** Open the same `index.html` in a **second** browser window (or a different browser).
4. Type a message in one window and hit send—it will appear in both!

### Key Simplifications Made:

* **No JSON:** We are sending raw strings to keep the code tiny.
* **No IDs:** We aren't checking who sent what; everyone sees the message as "incoming" for now just to prove the connection works.
* **Broadcast Logic:** The server simply repeats whatever it hears to every open window.

Would you like me to show you how to distinguish between "your" messages and "their" messages so they align to the left and right correctly?