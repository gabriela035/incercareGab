// script.js - WebSocket Chat Application

// WebSocket connection
let ws;
let wsConnected = false;
const WS_URL = 'ws://localhost:8080'; // Change to your server URL

// State management
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

// DOM elements
const conversationItems = document.querySelectorAll('.conversation-item');
const chatMessages = document.querySelector('.chat-messages');
const messageInput = document.querySelector('.chat-input-area input');
const sendButton = document.querySelector('.send-button');
const chatHeader = document.querySelector('.active-contact-info');
const searchInput = document.querySelector('.search-bar input');
const connectionStatus = document.querySelector('.inbox-status'); // We'll add status indicator

// Initialize WebSocket
function initWebSocket() {
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = function() {
            console.log('WebSocket connected');
            wsConnected = true;
            updateConnectionStatus(true);
            
            // Send user info to server
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
            console.log('WebSocket disconnected');
            wsConnected = false;
            updateConnectionStatus(false);
            
            // Try to reconnect after 3 seconds
            setTimeout(initWebSocket, 3000);
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
            wsConnected = false;
            updateConnectionStatus(false);
        };
    } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        wsConnected = false;
        updateConnectionStatus(false);
    }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(data) {
    console.log('Received:', data);
    
    switch(data.type) {
        case 'message':
            handleIncomingMessage(data.message);
            break;
            
        case 'user_online':
            updateUserStatus(data.userId, true);
            break;
            
        case 'user_offline':
            updateUserStatus(data.userId, false);
            break;
            
        case 'message_delivered':
            updateMessageStatus(data.messageId, 'delivered');
            break;
            
        case 'message_read':
            updateMessageStatus(data.messageId, 'read');
            break;
            
        case 'error':
            showNotification(data.message, 'error');
            break;
    }
}

// Handle incoming message
function handleIncomingMessage(message) {
    const sender = message.sender;
    
    // Initialize array if contact doesn't exist
    if (!messagesData[sender]) {
        messagesData[sender] = [];
    }
    
    // Add message to data
    messagesData[sender].push({
        ...message,
        type: 'incoming'
    });
    
    // Update UI if this contact is active
    if (sender === activeContact) {
        displayMessages(activeContact);
        // Send read receipt
        sendReadReceipt(message.id);
    } else {
        // Show notification dot on sidebar
        updateContactNotification(sender, true);
        // Update last message in sidebar
        updateSidebarLastMessage(sender, message.text);
    }
    
    // Update notification badge
    updateNotificationBadge();
}

// Send message via WebSocket
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

// Send read receipt
function sendReadReceipt(messageId) {
    if (!wsConnected) return;
    
    ws.send(JSON.stringify({
        type: 'read_receipt',
        messageId: messageId,
        reader: currentUser.name
    }));
}

// Initialize the app
function init() {
    // Initialize WebSocket
    initWebSocket();
    
    // Set up event listeners for conversation items
    conversationItems.forEach(item => {
        item.addEventListener('click', () => {
            const contactName = item.querySelector('.contact-name').textContent;
            switchConversation(contactName);
            
            // Update active state in sidebar
            conversationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Mark as read
            item.classList.remove('unread');
            const dot = item.querySelector('.notification-dot');
            if (dot) dot.style.display = 'none';
            
            // Update notification badge
            updateNotificationBadge();
        });
    });

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Search functionality
    searchInput.addEventListener('input', filterContacts);

    // Initialize with first conversation
    switchConversation(activeContact);
    updateNotificationBadge();
}

// Send message function (updated for WebSocket)
function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text) return;
    
    if (!wsConnected) {
        showNotification('Cannot send message - disconnected', 'error');
        return;
    }
    
    // Create message object
    const messageObj = {
        id: Date.now(),
        text: text,
        time: getCurrentTime(),
        type: 'outgoing',
        date: 'Today',
        sender: currentUser.name,
        recipient: activeContact
    };
    
    // Send via WebSocket
    const messageId = sendMessageWebSocket({
        text: text,
        time: messageObj.time,
        date: messageObj.date
    });
    
    if (messageId) {
        // Add to local data
        messagesData[activeContact].push({
            ...messageObj,
            id: messageId,
            status: 'sending'
        });
        
        // Update UI
        displayMessages(activeContact);
        
        // Clear input
        messageInput.value = '';
        
        // Update sidebar last message
        updateSidebarLastMessage(activeContact, text);
        
        // Scroll to bottom
        scrollToBottom();
    }
}

// Switch to a different conversation
function switchConversation(contactName) {
    activeContact = contactName;
    
    // Update chat header
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
    
    // Clear and load messages
    chatMessages.innerHTML = '';
    displayMessages(contactName);
    
    // Focus on input
    messageInput.focus();
    
    // Clear notification for this contact
    updateContactNotification(contactName, false);
}

// Display messages for a contact (updated for WebSocket)
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
        // Add date divider if date changes
        if (msg.date !== currentDate) {
            currentDate = msg.date;
            messagesHTML += `<div class="date-divider"><span>${msg.date}</span></div>`;
        }
        
        messagesHTML += createMessageHTML(msg, index);
    });
    
    chatMessages.innerHTML = messagesHTML;
    
    // Scroll to bottom
    scrollToBottom();
}

// Create message HTML
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

// Helper functions
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
    
    // Add to sidebar header if not already there
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
            
            // Add notification dot if not present
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

function filterContacts() {
    const searchTerm = searchInput.value.toLowerCase();
    const contactItems = document.querySelectorAll('.conversation-item');
    
    contactItems.forEach(item => {
        const contactName = item.querySelector('.contact-name').textContent.toLowerCase();
        const contactRole = item.querySelector('.contact-role').textContent.toLowerCase();
        
        if (contactName.includes(searchTerm) || contactRole.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
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
    
    // Remove after 3 seconds
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);