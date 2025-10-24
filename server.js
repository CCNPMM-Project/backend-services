require("dotenv").config(); // Nạp biến môi trường từ .env
const app = require("./app"); // Import app.js
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Cấu hình Socket.io với CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/'
});

console.log('🔌 Socket.io server created');

// Lưu Socket.io instance để sử dụng trong các service
global.io = io;
app.set('io', io);

// Store connected users
const connectedUsers = new Map();

// Middleware xác thực JWT cho Socket.io
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ User ${socket.userId} connected via Socket.io`);
  
  // User joins their personal room
  socket.join(`user_${socket.userId}`);
  connectedUsers.set(socket.userId, socket);
  
  // Gửi thông báo chào mừng
  socket.emit('connected', {
    message: 'Kết nối thành công',
    userId: socket.userId
  });

  // Xử lý join room cho notifications
  socket.on('join_notifications', () => {
    socket.join(`notifications_${socket.userId}`);
    console.log(`👤 User ${socket.userId} joined notifications room`);
  });

  // Xử lý leave room
  socket.on('leave_notifications', () => {
    socket.leave(`notifications_${socket.userId}`);
    console.log(`👤 User ${socket.userId} left notifications room`);
  });

  // Xử lý typing indicators (nếu cần)
  socket.on('typing_start', (data) => {
    socket.to(`user_${data.recipientId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`user_${data.recipientId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: false
    });
  });

  // Xử lý disconnect
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User ${socket.userId} disconnected: ${reason}`);
    connectedUsers.delete(socket.userId);
  });

  // Xử lý lỗi
  socket.on('error', (error) => {
    console.error(`❌ Socket error for user ${socket.userId}:`, error);
  });
});

// Helper function to send notification to user
const sendNotificationToUser = (userId, notification) => {
  const socket = connectedUsers.get(userId);
  if (socket) {
    socket.emit('new_notification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      data: notification.data,
      createdAt: notification.createdAt
    });
    console.log(`📨 Notification sent to user ${userId}`);
  } else {
    console.log(`❌ User ${userId} not connected`);
  }
};

// Helper function to send unread count to user
const sendUnreadCountToUser = (userId, count) => {
  const socket = connectedUsers.get(userId);
  if (socket) {
    socket.emit('unread_count_update', { count });
    console.log(`📊 Unread count sent to user ${userId}: ${count}`);
  } else {
    console.log(`❌ User ${userId} not connected`);
  }
};

// Helper function to broadcast to all users
const broadcastToAll = (event, data) => {
  io.emit(event, data);
  console.log(`📢 Broadcasted ${event} to all users`);
};

// Helper function to broadcast to specific role
const broadcastToRole = (role, event, data) => {
  io.to(`role_${role}`).emit(event, data);
  console.log(`📢 Broadcasted ${event} to role ${role}`);
};

// Export helper functions
app.set('sendNotificationToUser', sendNotificationToUser);
app.set('sendUnreadCountToUser', sendUnreadCountToUser);
app.set('broadcastToAll', broadcastToAll);
app.set('broadcastToRole', broadcastToRole);

// Socket.io server error handling
io.on('error', (error) => {
  console.error('❌ Socket.io server error:', error);
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔌 Socket.io server available at http://localhost:${PORT}/socket.io/`);
});
