const socket = new WebSocket('ws://localhost:8080');

// Create a unique ID for this specific tab
const myId = Math.random().toString(36).substring(2, 9);

const messageInput = document.querySelector('#message-input');
const sendButton = document.querySelector('.send-button');
const chatMessages = document.querySelector('.chat-messages');
const moreOptionsBtn = document.querySelector('.more-options');
const emojiBtn = document.querySelector('.action-icon');
const emojiPicker = document.querySelector('#emoji-picker');

// --- 1. SENDING ---
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message) {
        // We send the text AND our unique ID
        const payload = {
            text: message,
            senderId: myId
        };
        socket.send(JSON.stringify(payload)); 
        messageInput.value = '';
    }
});

// --- 2. RECEIVING ---
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // If the ID matches this tab, it's 'outgoing' (right side)
    // If it's different, it's 'incoming' (left side)
    const type = (data.senderId === myId) ? 'outgoing' : 'incoming';
    
    displayMessage(data.text, type);
};

// Helper to render bubbles
function displayMessage(text, type) {
    const newMessage = document.createElement('div');
    newMessage.className = `message-group ${type}`; 
    
    // Only show the avatar for incoming messages
    const avatarHtml = type === 'incoming' 
        ? `<img src="https://i.pravatar.cc/150?img=16" class="message-avatar" />` 
        : '';

    newMessage.innerHTML = `
        ${avatarHtml}
        <div class="message-content">
            <div class="message-bubble">
                <p>${text}</p>
            </div>
        </div>
    `;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- 3. CLEAR CHAT ---
moreOptionsBtn.addEventListener('click', () => {
    if (confirm("Clear all messages?")) {
        chatMessages.innerHTML = '';
    }
});

// --- 4. EMOJI LOGIC ---
emojiBtn.addEventListener('click', () => {
    const isHidden = emojiPicker.style.display === 'none';
    emojiPicker.style.display = isHidden ? 'flex' : 'none';
});

emojiPicker.querySelectorAll('span').forEach(emoji => {
    emoji.addEventListener('click', () => {
        messageInput.value += emoji.innerText;
        emojiPicker.style.display = 'none';
        messageInput.focus();
    });
});