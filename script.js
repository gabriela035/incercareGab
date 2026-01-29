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