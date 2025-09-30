const Notification = require("../models/Notification");
const User = require("../models/User");

const createNotification = async (userId, title, message, type = "system", data = {}) => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    data
  });

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
const notifyNewApplication = async (jobId, applicantId, jobTitle, companyName) => {
  try {
    // Lấy thông tin job để tìm recruiter
    const Job = require("../models/Job");
    const job = await Job.findById(jobId).populate("company");
    
    if (!job || !job.company.recruiter) {
      return;
    }

    const recruiterId = job.company.recruiter;
    
    await createNotification(
      recruiterId,
      "Ứng viên mới",
      `Có ứng viên mới ứng tuyển vào vị trí "${jobTitle}"`,
      "application",
      {
        jobId,
        applicantId,
        jobTitle,
        companyName
      }
    );

    return recruiterId;
  } catch (error) {
    console.error("Error creating new application notification:", error);
  }
};

const notifyJobStatusChange = async (jobId, jobTitle, status) => {
  try {
    const Job = require("../models/Job");
    const job = await Job.findById(jobId).populate("company");
    
    if (!job || !job.company.recruiter) {
      return;
    }

    const recruiterId = job.company.recruiter;
    const statusText = status === "active" ? "được kích hoạt" : "bị đóng";
    
    await createNotification(
      recruiterId,
      "Cập nhật trạng thái công việc",
      `Công việc "${jobTitle}" đã ${statusText}`,
      "job_update",
      {
        jobId,
        jobTitle,
        status
      }
    );

    return recruiterId;
  } catch (error) {
    console.error("Error creating job status change notification:", error);
  }
};

const notifyApplicationStatusChange = async (applicationId, jobTitle, status, applicantId) => {
  try {
    const statusText = status === "accepted" ? "được chấp nhận" : "bị từ chối";
    
    await createNotification(
      applicantId,
      "Cập nhật đơn ứng tuyển",
      `Đơn ứng tuyển cho "${jobTitle}" đã ${statusText}`,
      "application",
      {
        applicationId,
        jobTitle,
        status
      }
    );

    return applicantId;
  } catch (error) {
    console.error("Error creating application status change notification:", error);
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  notifyNewApplication,
  notifyJobStatusChange,
  notifyApplicationStatusChange
};
