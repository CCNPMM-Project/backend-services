const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, "Tiêu đề thông báo không được vượt quá 100 ký tự"]
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, "Nội dung thông báo không được vượt quá 500 ký tự"]
  },
  type: {
    type: String,
    enum: [
      // Cho ứng viên
      "application_status",      // Trạng thái đơn ứng tuyển
      "job_match",              // Công việc phù hợp
      "deadline_reminder",       // Nhắc deadline ứng tuyển
      "profile_viewed",          // Công ty xem hồ sơ
      
      // Cho nhà tuyển dụng
      "new_applicant",           // Ứng viên mới đăng ký
      "job_expiring",           // Công việc sắp hết hạn
      "weekly_stats",           // Thống kê hàng tuần
      "monthly_stats",          // Thống kê hàng tháng
      "company_interest",        // Ứng viên quan tâm đến công ty
      
      // Hệ thống
      "system",                  // Thông báo hệ thống
      "reminder"                // Nhắc nhở
    ],
    default: "system"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Thông tin email
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  // Thông tin WebSocket
  socketSent: {
    type: Boolean,
    default: false
  },
  socketSentAt: {
    type: Date
  },
  // Thời gian hết hạn thông báo (tùy chọn)
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index để tìm kiếm nhanh
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual để kiểm tra thông báo có hết hạn không
NotificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Middleware để tự động đánh dấu socketSent khi tạo
NotificationSchema.pre('save', function(next) {
  if (this.isNew && !this.socketSent) {
    this.socketSent = true;
    this.socketSentAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Notification", NotificationSchema);

