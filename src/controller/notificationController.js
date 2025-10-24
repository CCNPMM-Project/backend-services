const notificationService = require("../services/notificationService");

/**
 * Lấy danh sách thông báo của user với filter và search
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      priority, 
      isRead,
      search 
    } = req.query;

    // Xây dựng filter
    const filter = { user: userId };
    
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    // Search trong title và message
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const result = await notificationService.getUserNotifications(
      userId, 
      parseInt(page), 
      parseInt(limit),
      filter
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

/**
 * Gửi thông báo mới (cho admin hoặc system)
 */
const sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type, data, options } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "userId, title, message là bắt buộc" 
      });
    }

    const notification = await notificationService.createNotification(
      userId,
      title,
      message,
      type || "system",
      data || {},
      options || {}
    );

    res.status(201).json({ 
      success: true, 
      data: notification,
      message: "Đã gửi thông báo thành công" 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Gửi thông báo hàng loạt
 */
const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, title, message, type, data, options } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "userIds phải là array và không được rỗng" 
      });
    }

    if (!title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "title, message là bắt buộc" 
      });
    }

    const results = await notificationService.sendBulkNotification(
      userIds,
      title,
      message,
      type || "system",
      data || {},
      options || {}
    );

    res.status(201).json({ 
      success: true, 
      data: results,
      message: "Đã gửi thông báo hàng loạt" 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Lấy thống kê thông báo
 */
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await notificationService.getNotificationStats(userId);

    res.status(200).json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Lấy thông báo theo ID
 */
const getNotificationById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;

    const Notification = require("../models/Notification");
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông báo" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: notification 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Xóa tất cả thông báo đã đọc
 */
const deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const Notification = require("../models/Notification");
    const result = await Notification.deleteMany({
      user: userId,
      isRead: true
    });

    res.status(200).json({ 
      success: true, 
      data: { deletedCount: result.deletedCount },
      message: "Đã xóa tất cả thông báo đã đọc" 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  sendNotification,
  sendBulkNotification,
  getNotificationStats
};
