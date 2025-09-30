require("dotenv").config(); // Nạp biến môi trường từ .env
const app = require("./app"); // Import app.js
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT;
const server = http.createServer(app);

// Tạo WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

console.log('🔌 WebSocket server created on path /ws');

// Lưu WebSocket server để sử dụng trong các controller
app.set('wss', wss);

// Store connected users
const connectedUsers = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('✅ User connected via WebSocket');
  console.log('📡 Connection details:', {
    url: req.url,
    headers: req.headers
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message received:', data);
      
      if (data.type === 'join') {
        // User joins their room
        connectedUsers.set(data.userId, ws);
        ws.userId = data.userId;
        console.log(`👤 User ${data.userId} joined their room`);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 User disconnected from WebSocket');
    if (ws.userId) {
      connectedUsers.delete(ws.userId);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    if (ws.userId) {
      connectedUsers.delete(ws.userId);
    }
  });
});

// Helper function to send notification to user
const sendNotificationToUser = (userId, notification) => {
  const userWs = connectedUsers.get(userId);
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    userWs.send(JSON.stringify({
      type: 'notification',
      notification: notification
    }));
    console.log(`📨 Notification sent to user ${userId}`);
  } else {
    console.log(`❌ User ${userId} not connected`);
  }
};

// Helper function to send unread count to user
const sendUnreadCountToUser = (userId, count) => {
  const userWs = connectedUsers.get(userId);
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    userWs.send(JSON.stringify({
      type: 'unreadCount',
      count: count
    }));
    console.log(`📊 Unread count sent to user ${userId}: ${count}`);
  }
};

// Export helper functions
app.set('sendNotificationToUser', sendNotificationToUser);
app.set('sendUnreadCountToUser', sendUnreadCountToUser);

// WebSocket server error handling
wss.on('error', (error) => {
  console.error('❌ WebSocket server error:', error);
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}/ws`);
});
