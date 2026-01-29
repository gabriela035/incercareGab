const socket = new WebSocket('ws://localhost:8080');

const messageInput = document.querySelector('#message-input');
const sendButton = document.querySelector('.send-button');
const chatMessages = document.querySelector('.chat-messages');
const moreOptionsBtn = document.querySelector('.more-options');
const emojiBtn = document.querySelector('.action-icon');
const emojiPicker = document.querySelector('#emoji-picker');

// --- 1. SENDING MESSAGES ---
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message) {
        // We wrap the message in a simple object to label it as "outgoing"
        const data = { text: message, sender: 'me' };
        socket.send(JSON.stringify(data)); 
        
        displayMessage(message, 'outgoing');
        messageInput.value = '';
    }
});

// --- 2. RECEIVING MESSAGES ---
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Only show the message if it's NOT from "me"
    if (data.sender !== 'me') {
        displayMessage(data.text, 'incoming');
    }
};

// Helper function to build the chat bubbles
function displayMessage(text, type) {
    const newMessage = document.createElement('div');
    newMessage.className = `message-group ${type}`; 
    newMessage.innerHTML = `
        <div class="message-content">
            <div class="message-bubble">
                <p>${text}</p>
            </div>
        </div>
    `;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}

// --- 3. CLEAR CHAT ---
moreOptionsBtn.addEventListener('click', () => {
    if (confirm("Clear all messages?")) {
        chatMessages.innerHTML = ''; // Wipes the message container
    }
});

// --- 4. EMOJI MENU LOGIC ---
// Toggle menu visibility
emojiBtn.addEventListener('click', () => {
    const isHidden = emojiPicker.style.display === 'none';
    emojiPicker.style.display = isHidden ? 'flex' : 'none';
});

// Add emoji to input when clicked
emojiPicker.querySelectorAll('span').forEach(emoji => {
    emoji.addEventListener('click', () => {
        messageInput.value += emoji.innerText;
        emojiPicker.style.display = 'none'; // Close menu after picking
        messageInput.focus(); // Keep typing
    });
});