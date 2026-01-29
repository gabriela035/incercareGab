const socket = new WebSocket('ws://localhost:8080');

// 1. Setup User Identity
const myId = Math.random().toString(36).substring(2, 9);
const usernames = ["FantasticMango", "SilverTiger", "BlueWhale", "GoldenOwl", "SwiftRabbit"];
const myUsername = usernames[Math.floor(Math.random() * usernames.length)] + "_" + Math.floor(Math.random() * 100);

document.querySelector('.active-contact-info h2').innerText = `Chatting as: ${myUsername}`;

const messageInput = document.querySelector('#message-input');
const sendButton = document.querySelector('.send-button');
const chatMessages = document.querySelector('.chat-messages');
const emojiBtn = document.querySelector('.action-icon');
const emojiPicker = document.querySelector('#emoji-picker');

// 2. Announce Join
socket.onopen = () => {
    socket.send(JSON.stringify({
        type: 'join',
        username: myUsername,
        text: `${myUsername} joined the chat`
    }));
};

// 3. Handle Incoming Data
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'text') {
        displayMessage(data.text, data.senderId === myId ? 'outgoing' : 'incoming', data.time, data.username);
    } 
    else if (data.type === 'join' || data.type === 'system') {
        displaySystemMessage(data.text);
    }
};

// 4. Send Message Logic
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        const now = new Date();
        const timeString = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
        
        socket.send(JSON.stringify({
            type: 'text',
            text: message,
            senderId: myId,
            username: myUsername,
            time: timeString
        })); 
        messageInput.value = '';
        emojiPicker.style.display = 'none';
    }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

// 5. Emoji Menu Logic
emojiBtn.addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'flex' : 'none';
});

emojiPicker.querySelectorAll('span').forEach(emoji => {
    emoji.addEventListener('click', () => {
        messageInput.value += emoji.innerText;
        messageInput.focus();
    });
});

// 6. Visual Helpers
function displaySystemMessage(text) {
    const note = document.createElement('div');
    note.style.cssText = 'text-align: center; color: #888; font-size: 12px; margin: 15px 0; font-style: italic; width: 100%;';
    note.innerText = text;
    chatMessages.appendChild(note);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayMessage(text, type, time, user) {
    const newMessage = document.createElement('div');
    newMessage.className = `message-group ${type}`; 
    const avatar = type === 'incoming' ? `<img src="https://i.pravatar.cc/150?u=${user}" class="message-avatar" />` : '';

    newMessage.innerHTML = `
        ${avatar}
        <div class="message-content">
            ${type === 'incoming' ? `<span style="font-size: 10px; font-weight: bold; margin-bottom: 2px; color: #555;">${user}</span>` : ''}
            <div class="message-bubble"><p>${text}</p></div>
            <span class="message-time" style="font-size: 10px; margin-top: 4px;">${time}</span>
        </div>
    `;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}