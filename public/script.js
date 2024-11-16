// script.js
const socket = io();
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const maxLogs = 50;
const logs = [];

// Function to check if the user is at the bottom of the messages container
function isUserAtBottom() {
    return messagesContainer.scrollHeight - messagesContainer.scrollTop === messagesContainer.clientHeight;
}

// Function to scroll to the bottom of the messages container
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Load previous messages when the connection is established
socket.on('previous messages', function(messages) {
    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = msg;
        messagesContainer.appendChild(msgDiv);
    });
    // Scroll to the bottom if the user is at the bottom
    if (isUserAtBottom()) {
        scrollToBottom();
    }
});

// Listen for new log messages
socket.on('log message', function(log) {
    const wasAtBottom = isUserAtBottom(); // Check if the user was at the bottom

    const logDiv = document.createElement('div');
    logDiv.textContent = log; // Display the log message
    messagesContainer.appendChild(logDiv);

    // Scroll to the bottom if the user was at the bottom
    if (wasAtBottom) {
        scrollToBottom();
    }
});

// Send message when the send button is clicked
sendButton.addEventListener('click', function() {
    const msg = messageInput.value.trim();
    if (msg) {
        socket.emit('chat message', msg); // Emit the message to the server
        messageInput.value = ''; // Clear the input field
    }
});

// Optionally, send message when Enter key is pressed
messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendButton.click(); // Trigger the send button click
    }
});