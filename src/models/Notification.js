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
    enum: ["application", "job_update", "system", "reminder"],
    default: "system"
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index để tìm kiếm nhanh
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
