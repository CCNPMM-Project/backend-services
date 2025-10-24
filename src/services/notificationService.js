const Notification = require("../models/Notification");
const User = require("../models/User");
const emailService = require("./emailService");

/**
 * Tạo thông báo mới với hỗ trợ email và WebSocket
 * @param {string} userId - ID của user
 * @param {string} title - Tiêu đề thông báo
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo
 * @param {Object} data - Dữ liệu bổ sung
 * @param {Object} options - Tùy chọn gửi
 */
const createNotification = async (userId, title, message, type = "system", data = {}, options = {}) => {
  const {
    priority = "medium",
    sendEmail = false,
    sendSocket = true,
    expiresAt = null,
    actionUrl = null
  } = options;

  // Tạo thông báo trong database
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    priority,
    data: {
      ...data,
      actionUrl
    },
    expiresAt
  });

  // Gửi qua WebSocket nếu được yêu cầu
  if (sendSocket) {
    await sendSocketNotification(userId, notification);
  }

  // Gửi email nếu được yêu cầu
  if (sendEmail) {
    await emailService.sendNotificationEmail(userId, notification);
  }

  return notification;
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ user: userId });

  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { 
      isRead: true, 
      readAt: new Date() 
    },
    { new: true }
  );

  if (!notification) {
    throw new Error("Thông báo không tồn tại hoặc bạn không có quyền truy cập!");
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );

  return result;
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ 
    user: userId, 
    isRead: false 
  });
  
  return count;
};

const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: userId
  });

  if (!notification) {
    throw new Error("Thông báo không tồn tại hoặc bạn không có quyền truy cập!");
  }

  return notification;
};

// Các hàm trigger thông báo
/**
 * Gửi thông báo qua WebSocket
 * @param {string} userId - ID của user
 * @param {Object} notification - Thông báo
 */
const sendSocketNotification = async (userId, notification) => {
  try {
    // Lấy socket instance từ app (sẽ được set trong server.js)
    const io = global.io;
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        data: notification.data,
        createdAt: notification.createdAt
      });
    }
  } catch (error) {
    console.error('Error sending socket notification:', error);
  }
};

/**
 * Gửi thông báo cho ứng viên - Trạng thái đơn ứng tuyển
 */
const notifyApplicationStatusChange = async (applicationId, jobTitle, status, applicantId) => {
  try {
    const statusText = status === "accepted" ? "được chấp nhận" : "bị từ chối";
    const priority = status === "accepted" ? "high" : "medium";
    
    await createNotification(
      applicantId,
      "Cập nhật đơn ứng tuyển",
      `Đơn ứng tuyển cho "${jobTitle}" đã ${statusText}`,
      "application_status",
      {
        applicationId,
        jobTitle,
        status
      },
      {
        priority,
        sendEmail: true,
        actionUrl: `/applications/${applicationId}`
      }
    );

    return applicantId;
  } catch (error) {
    console.error("Error creating application status change notification:", error);
  }
};

/**
 * Gửi thông báo cho ứng viên - Công việc phù hợp
 */
const notifyJobMatch = async (userId, jobId, jobTitle, companyName, salary) => {
  try {
    await createNotification(
      userId,
      "Công việc phù hợp",
      `Có công việc "${jobTitle}" tại ${companyName} phù hợp với hồ sơ của bạn`,
      "job_match",
      {
        jobId,
        jobTitle,
        companyName,
        salary
      },
      {
        priority: "medium",
        sendEmail: true,
        actionUrl: `/jobs/${jobId}`
      }
    );
  } catch (error) {
    console.error("Error creating job match notification:", error);
  }
};

/**
 * Gửi thông báo cho ứng viên - Nhắc deadline ứng tuyển
 */
const notifyDeadlineReminder = async (userId, jobTitle, daysLeft) => {
  try {
    const priority = daysLeft <= 1 ? "urgent" : daysLeft <= 3 ? "high" : "medium";
    
    await createNotification(
      userId,
      "Nhắc nhở deadline ứng tuyển",
      `Công việc "${jobTitle}" còn ${daysLeft} ngày để ứng tuyển`,
      "deadline_reminder",
      {
        jobTitle,
        daysLeft
      },
      {
        priority,
        sendEmail: true
      }
    );
  } catch (error) {
    console.error("Error creating deadline reminder notification:", error);
  }
};

/**
 * Gửi thông báo cho ứng viên - Công ty xem hồ sơ
 */
const notifyProfileViewed = async (userId, companyName, jobTitle) => {
  try {
    await createNotification(
      userId,
      "Hồ sơ được xem",
      `${companyName} đã xem hồ sơ của bạn cho vị trí "${jobTitle}"`,
      "profile_viewed",
      {
        companyName,
        jobTitle
      },
      {
        priority: "low",
        sendEmail: false
      }
    );
  } catch (error) {
    console.error("Error creating profile viewed notification:", error);
  }
};

/**
 * Gửi thông báo cho nhà tuyển dụng - Ứng viên mới đăng ký
 */
const notifyNewApplicant = async (jobId, applicantId, jobTitle, companyName, applicantName) => {
  try {
    const Job = require("../models/Job");
    const job = await Job.findById(jobId).populate("company");
    
    if (!job || !job.company.recruiter) {
      return;
    }

    const recruiterId = job.company.recruiter;
    
    await createNotification(
      recruiterId,
      "Ứng viên mới",
      `Có ứng viên mới "${applicantName}" ứng tuyển vào vị trí "${jobTitle}"`,
      "new_applicant",
      {
        jobId,
        applicantId,
        jobTitle,
        companyName,
        applicantName
      },
      {
        priority: "high",
        sendEmail: true,
        actionUrl: `/applications?job=${jobId}`
      }
    );

    return recruiterId;
  } catch (error) {
    console.error("Error creating new applicant notification:", error);
  }
};

/**
 * Gửi thông báo cho nhà tuyển dụng - Công việc sắp hết hạn
 */
const notifyJobExpiring = async (jobId, jobTitle, daysLeft, companyName) => {
  try {
    const Job = require("../models/Job");
    const job = await Job.findById(jobId).populate("company");
    
    if (!job || !job.company.recruiter) {
      return;
    }

    const recruiterId = job.company.recruiter;
    const priority = daysLeft <= 1 ? "urgent" : daysLeft <= 3 ? "high" : "medium";
    
    await createNotification(
      recruiterId,
      "Công việc sắp hết hạn",
      `Công việc "${jobTitle}" còn ${daysLeft} ngày để hết hạn`,
      "job_expiring",
      {
        jobId,
        jobTitle,
        daysLeft,
        companyName
      },
      {
        priority,
        sendEmail: true,
        actionUrl: `/jobs/${jobId}/edit`
      }
    );

    return recruiterId;
  } catch (error) {
    console.error("Error creating job expiring notification:", error);
  }
};

/**
 * Gửi thông báo thống kê hàng tuần cho nhà tuyển dụng
 */
const notifyWeeklyStats = async (recruiterId, stats) => {
  try {
    await createNotification(
      recruiterId,
      "Báo cáo thống kê tuần",
      `Tuần này bạn có ${stats.totalApplications || 0} đơn ứng tuyển mới và ${stats.newJobs || 0} công việc được đăng`,
      "weekly_stats",
      stats,
      {
        priority: "low",
        sendEmail: true
      }
    );
  } catch (error) {
    console.error("Error creating weekly stats notification:", error);
  }
};

/**
 * Gửi thông báo thống kê hàng tháng cho nhà tuyển dụng
 */
const notifyMonthlyStats = async (recruiterId, stats) => {
  try {
    await createNotification(
      recruiterId,
      "Báo cáo thống kê tháng",
      `Tháng này bạn có ${stats.totalApplications || 0} đơn ứng tuyển và ${stats.acceptedApplications || 0} ứng viên được chấp nhận`,
      "monthly_stats",
      stats,
      {
        priority: "low",
        sendEmail: true
      }
    );
  } catch (error) {
    console.error("Error creating monthly stats notification:", error);
  }
};

/**
 * Gửi thông báo cho nhà tuyển dụng - Ứng viên quan tâm đến công ty
 */
const notifyCompanyInterest = async (recruiterId, applicantName, companyName, jobTitle) => {
  try {
    await createNotification(
      recruiterId,
      "Ứng viên quan tâm",
      `Ứng viên "${applicantName}" đã quan tâm đến công ty ${companyName} cho vị trí "${jobTitle}"`,
      "company_interest",
      {
        applicantName,
        companyName,
        jobTitle
      },
      {
        priority: "medium",
        sendEmail: false
      }
    );
  } catch (error) {
    console.error("Error creating company interest notification:", error);
  }
};

/**
 * Gửi thông báo hàng loạt cho nhiều user
 */
const sendBulkNotification = async (userIds, title, message, type = "system", data = {}, options = {}) => {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const notification = await createNotification(userId, title, message, type, data, options);
      results.push({ userId, success: true, notificationId: notification._id });
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
    }
  }

  return results;
};

/**
 * Lấy thống kê thông báo của user
 */
const getNotificationStats = async (userId) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
          byType: {
            $push: {
              type: "$type",
              isRead: "$isRead"
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        unread: 0,
        byType: {}
      };
    }

    const result = stats[0];
    const byType = {};
    
    result.byType.forEach(item => {
      if (!byType[item.type]) {
        byType[item.type] = { total: 0, unread: 0 };
      }
      byType[item.type].total++;
      if (!item.isRead) {
        byType[item.type].unread++;
      }
    });

    return {
      total: result.total,
      unread: result.unread,
      byType
    };
  } catch (error) {
    console.error("Error getting notification stats:", error);
    return { total: 0, unread: 0, byType: {} };
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  sendSocketNotification,
  
  // Các hàm thông báo cho ứng viên
  notifyApplicationStatusChange,
  notifyJobMatch,
  notifyDeadlineReminder,
  notifyProfileViewed,
  
  // Các hàm thông báo cho nhà tuyển dụng
  notifyNewApplicant,
  notifyJobExpiring,
  notifyWeeklyStats,
  notifyMonthlyStats,
  notifyCompanyInterest,
  
  // Các hàm tiện ích
  sendBulkNotification,
  getNotificationStats
};

