let ws;
let wsConnected = false;
const WS_URL = 'ws://localhost:8080';

let messagesData = {
    "Leslie Alexander": [
        { text: "Welcome to the chat!", time: getCurrentTime(), type: "incoming", date: getCurrentDate(), sender: "Leslie Alexander", id: Date.now() }
    ],
    "Marvin McKinney": [],
    "Jacob Jones": [],
    "Eleanor Pena": [],
    "Kathryn Murphy": [],
    "Wade Warren": []
};

let activeContact = "Leslie Alexander";
let currentUser = {
    name: "You",
    avatar: "https://i.pravatar.cc/150?img=8",
    id: "user_" + Math.random().toString(36).substr(2, 9)
};

const conversationItems = document.querySelectorAll('.conversation-item');
const chatMessages = document.querySelector('.chat-messages');
const messageInput = document.querySelector('.chat-input-area input');
const sendButton = document.querySelector('.send-button');
const chatHeader = document.querySelector('.active-contact-info');

function initWebSocket() {
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = function() {
            wsConnected = true;
            updateConnectionStatus(true);
            ws.send(JSON.stringify({
                type: 'user_join',
                user: currentUser,
                contacts: Object.keys(messagesData)
            }));
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        ws.onclose = function() {
            wsConnected = false;
            updateConnectionStatus(false);
            setTimeout(initWebSocket, 3000);
        };
        
        ws.onerror = function(error) {
            wsConnected = false;
            updateConnectionStatus(false);
        };
    } catch (error) {
        wsConnected = false;
        updateConnectionStatus(false);
    }
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'message':
            handleIncomingMessage(data.message);
            break;
        case 'error':
            showNotification(data.message, 'error');
            break;
    }
}

function handleIncomingMessage(message) {
    const sender = message.sender;
    
    if (!messagesData[sender]) {
        messagesData[sender] = [];
    }
    
    messagesData[sender].push({
        ...message,
        type: 'incoming'
    });
    
    if (sender === activeContact) {
        displayMessages(activeContact);
    } else {
        updateContactNotification(sender, true);
        updateSidebarLastMessage(sender, message.text);
    }
    
    updateNotificationBadge();
}

function sendMessageWebSocket(message) {
    if (!wsConnected) {
        showNotification('Not connected to server', 'error');
        return false;
    }
    
    const messageData = {
        type: 'message',
        message: {
            id: Date.now(),
            text: message.text,
            time: message.time,
            date: message.date,
            sender: currentUser.name,
            recipient: activeContact,
            type: 'outgoing'
        }
    };
    
    ws.send(JSON.stringify(messageData));
    return messageData.message.id;
}

function init() {
    initWebSocket();
    
    conversationItems.forEach(item => {
        item.addEventListener('click', () => {
            const contactName = item.querySelector('.contact-name').textContent;
            switchConversation(contactName);
            
            conversationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            item.classList.remove('unread');
            const dot = item.querySelector('.notification-dot');
            if (dot) dot.style.display = 'none';
            
            updateNotificationBadge();
        });
    });

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    switchConversation(activeContact);
    updateNotificationBadge();
}

function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text) return;
    
    if (!wsConnected) {
        showNotification('Cannot send message - disconnected', 'error');
        return;
    }
    
    const messageObj = {
        id: Date.now(),
        text: text,
        time: getCurrentTime(),
        type: 'outgoing',
        date: 'Today',
        sender: currentUser.name,
        recipient: activeContact
    };
    
    const messageId = sendMessageWebSocket({
        text: text,
        time: messageObj.time,
        date: messageObj.date
    });
    
    if (messageId) {
        messagesData[activeContact].push({
            ...messageObj,
            id: messageId,
            status: 'sending'
        });
        
        displayMessages(activeContact);
        messageInput.value = '';
        updateSidebarLastMessage(activeContact, text);
        scrollToBottom();
    }
}

function switchConversation(contactName) {
    activeContact = contactName;
    
    const contactItem = document.querySelector(`.contact-name:contains("${contactName}")`)?.closest('.conversation-item');
    if (contactItem) {
        const avatar = contactItem.querySelector('img').src;
        const role = contactItem.querySelector('.contact-role').textContent;
        
        chatHeader.innerHTML = `
            <img src="${avatar}" alt="${contactName}" class="header-avatar">
            <div>
                <h2>${contactName}</h2>
                <span>${role}</span>
            </div>
        `;
    }
    
    chatMessages.innerHTML = '';
    displayMessages(contactName);
    messageInput.focus();
    updateContactNotification(contactName, false);
}

function displayMessages(contactName) {
    const messages = messagesData[contactName];
    
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="empty-state">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    let currentDate = '';
    let messagesHTML = '';
    
    messages.forEach((msg, index) => {
        if (msg.date !== currentDate) {
            currentDate = msg.date;
            messagesHTML += `<div class="date-divider"><span>${msg.date}</span></div>`;
        }
        
        messagesHTML += createMessageHTML(msg, index);
    });
    
    chatMessages.innerHTML = messagesHTML;
    scrollToBottom();
}

function createMessageHTML(msg, index) {
    const isOutgoing = msg.type === 'outgoing';
    const avatar = isOutgoing ? currentUser.avatar : `https://i.pravatar.cc/150?img=${getContactImgIndex(msg.sender)}`;
    
    return `
        <div class="message-group ${msg.type}" data-message-id="${msg.id}">
            ${!isOutgoing ? `<img src="${avatar}" alt="${msg.sender}" class="message-avatar">` : ''}
            <div class="message-content">
                <div class="message-bubble">
                    <p>${msg.text}</p>
                    ${isOutgoing ? `<span class="message-status">${msg.status || 'sent'}</span>` : ''}
                </div>
                <span class="message-time">${msg.time}</span>
            </div>
            ${isOutgoing ? `<img src="${avatar}" alt="Me" class="message-avatar">` : ''}
        </div>
    `;
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getCurrentDate() {
    const now = new Date();
    const options = { month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateConnectionStatus(connected) {
    const statusElement = document.createElement('div');
    statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
    statusElement.innerHTML = `
        <span class="status-dot ${connected ? 'connected' : 'disconnected'}"></span>
        <span>${connected ? 'Connected' : 'Connecting...'}</span>
    `;
    
    const existingStatus = document.querySelector('.connection-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
        sidebarHeader.appendChild(statusElement);
    }
}

function updateContactNotification(contactName, hasNotification) {
    const contactItem = document.querySelector(`.contact-name:contains("${contactName}")`)?.closest('.conversation-item');
    if (contactItem) {
        if (hasNotification && contactName !== activeContact) {
            contactItem.classList.add('unread');
            
            const avatarContainer = contactItem.querySelector('.avatar-container');
            if (avatarContainer && !avatarContainer.querySelector('.notification-dot')) {
                const dot = document.createElement('span');
                dot.className = 'notification-dot';
                avatarContainer.appendChild(dot);
            }
        } else {
            contactItem.classList.remove('unread');
            const dot = contactItem.querySelector('.notification-dot');
            if (dot) dot.style.display = 'none';
        }
    }
}

function updateSidebarLastMessage(contactName, lastMessage) {
    const contactItem = document.querySelector(`.contact-name:contains("${contactName}")`)?.closest('.conversation-item');
    if (contactItem) {
        const lastMessageEl = contactItem.querySelector('.last-message');
        const timeEl = contactItem.querySelector('.time');
        
        if (lastMessageEl) {
            lastMessageEl.textContent = lastMessage.length > 30 ? lastMessage.substring(0, 30) + '...' : lastMessage;
        }
        
        if (timeEl) {
            timeEl.textContent = getCurrentTime();
        }
    }
}

function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.conversation-item.unread').length;
    const badge = document.querySelector('.badge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = `${unreadCount} New`;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        background: ${type === 'error' ? '#f44336' : '#4CAF50'};
        color: white;
        border-radius: 4px;
        z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function getContactImgIndex(contactName) {
    const contacts = {
        "Leslie Alexander": 3,
        "Marvin McKinney": 1,
        "Jacob Jones": 2,
        "Eleanor Pena": 4,
        "Kathryn Murphy": 5,
        "Wade Warren": 6
    };
    return contacts[contactName] || 1;
}

document.addEventListener('DOMContentLoaded', init);