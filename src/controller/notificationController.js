const notificationService = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getUserNotifications(
      userId, 
      parseInt(page), 
      parseInt(limit)
    );

    res.status(200).json({ 
      success: true, 
      data: result.notifications, 
      pagination: result.pagination 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({ 
      success: true, 
      data: { unreadCount: count } 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;

    const notification = await notificationService.markAsRead(notificationId, userId);

    // Gửi cập nhật unread count qua WebSocket
    const unreadCount = await notificationService.getUnreadCount(userId);
    const sendUnreadCountToUser = req.app.get('sendUnreadCountToUser');
    if (sendUnreadCountToUser) {
      sendUnreadCountToUser(userId, unreadCount);
    }

    res.status(200).json({ 
      success: true, 
      data: notification,
      unreadCount,
      message: "Đã đánh dấu thông báo là đã đọc" 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await notificationService.markAllAsRead(userId);

    // Gửi cập nhật unread count qua WebSocket
    const unreadCount = await notificationService.getUnreadCount(userId);
    const sendUnreadCountToUser = req.app.get('sendUnreadCountToUser');
    if (sendUnreadCountToUser) {
      sendUnreadCountToUser(userId, unreadCount);
    }

    res.status(200).json({ 
      success: true, 
      data: { modifiedCount: result.modifiedCount },
      unreadCount,
      message: "Đã đánh dấu tất cả thông báo là đã đọc" 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;

    const notification = await notificationService.deleteNotification(notificationId, userId);

    res.status(200).json({ 
      success: true, 
      data: notification,
      message: "Đã xóa thông báo" 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
