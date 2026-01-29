Think of this code as a two-part system: the **Server** (the hub) and the **Client** (your browser).

### 1. The Server (`server.js`)

The server acts like a **mail sorter**. Its only job is to receive a message and pass it along to everyone else.

* **The Connection:** `wss.on('connection', ...)` is the server noticing someone has joined the chat. It keeps a list of these people.
* **The Listener:** `socket.on('message', ...)` tells the server: "If anyone sends you text, pay attention".
* **The Broadcast:** `wss.clients.forEach(...)` is the server taking that text and "shouting" it out to every person currently connected so they can all see it.

### 2. The Frontend (`script.js`)

This code controls what you see on your screen and how you interact with the server.

* **The Link:** `new WebSocket(...)` creates a live, open pipe between your browser and the server. It doesn't close until you leave the page.
* **Sending:** When you click the button, `socket.send(message)` pushes your text through that pipe to the server.
* **Receiving:** `socket.onmessage` is the "ear" of your browser. Whenever the server "shouts" a message, this function catches it.
* **Updating the Screen:** Once a message is caught, the code creates a new "bubble" using `document.createElement` and physically attaches it to your chat window so you can read it.

---

### How the information travels:

1. **You** click send.
2. **Your Browser** sends the text to the **Server**.
3. **The Server** sends that same text to **Everyone** (including you).
4. **Everyone's Browser** creates a new HTML box to show the text.

