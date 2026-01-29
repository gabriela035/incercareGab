const socket = new WebSocket('ws://localhost:8080');

// 1. Setup Identity
const myId = Math.random().toString(36).substring(2, 9);
const usernames = ["FantasticMango", "SilverTiger", "BlueWhale", "GoldenOwl", "SwiftRabbit"];
const myUsername = usernames[Math.floor(Math.random() * usernames.length)] + "_" + Math.floor(Math.random() * 100);

document.querySelector('.active-contact-info h2').innerText = `Chatting as: ${myUsername}`;

const messageInput = document.querySelector('#message-input');
const sendButton = document.querySelector('.send-button');
const chatMessages = document.querySelector('.chat-messages');
const emojiBtn = document.querySelector('.action-icon');
const emojiPicker = document.querySelector('#emoji-picker');

// const clearBtn = document.querySelector('.more_options');

// clearBtn.addEventListener('click', () => {
//     if (confirm("Do you want to clear all messages?")) {
//         chatMessages.innerHTML = '';
//     }
// });

// 2. Sending Logic
function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        const now = new Date();
        const timeString = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
        
        const payload = {
            text: text,
            senderId: myId,
            username: myUsername,
            time: timeString
        };
        socket.send(JSON.stringify(payload)); 
        messageInput.value = '';
        emojiPicker.style.display = 'none';
    }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// 3. Receiving Logic
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const isMe = data.senderId === myId;
    displayMessage(data.text, isMe ? 'outgoing' : 'incoming', data.time, data.username);
};

// 4. Emoji Logic
emojiBtn.addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'flex' : 'none';
});

emojiPicker.querySelectorAll('span').forEach(emoji => {
    emoji.addEventListener('click', () => {
        messageInput.value += emoji.innerText;
        messageInput.focus();
    });
});

// 5. Visual Helper
function displayMessage(text, type, time, user) {
    const newMessage = document.createElement('div');
    newMessage.className = `message-group ${type}`; 
    const avatar = type === 'incoming' ? `<img src="https://i.pravatar.cc/150?u=${user}" class="message-avatar" />` : '';

    newMessage.innerHTML = `
        ${avatar}
        <div class="message-content">
            ${type === 'incoming' ? `<span style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">${user}</span>` : ''}
            <div class="message-bubble">
                <p>${text}</p>
            </div>
            <span class="message-time" style="font-size: 10px; margin-top: 4px;">${time}</span>
        </div>
    `;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}