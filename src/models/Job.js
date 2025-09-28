const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Tiêu đề công việc là bắt buộc"],
    trim: true,
    maxlength: [100, "Tiêu đề không được vượt quá 100 ký tự"],
  },
  description: {
    type: String,
    required: [true, "Mô tả công việc là bắt buộc"],
    trim: true,
    minlength: [10, "Mô tả phải có ít nhất 10 ký tự"],
  },
  requirements: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr) {
        return arr.every((item) => typeof item === "string" && item.length > 0);
      },
      message: "Yêu cầu phải là mảng các chuỗi không rỗng",
    },
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: [true, "Công ty là bắt buộc"],
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, "Địa điểm không được vượt quá 100 ký tự"],
  },
  salary: {
    min: {
      type: Number,
      min: [0, "Lương tối thiểu không được âm"],
    },
    max: {
      type: Number,
      min: [0, "Lương tối đa không được âm"],
    },
    currency: {
      type: String,
      enum: ["VND", "USD", "EUR"],
      default: "VND",
    },
  },
  jobType: {
    type: String,
    enum: ["full-time", "part-time", "remote", "contract", "internship"],
    required: [true, "Loại hình công việc là bắt buộc"],
  },
  experienceLevel: {
    type: String,
    enum: ["intern", "fresher", "junior", "mid-level", "senior"],
    default: "fresher",
  },
  category: {
    type: String,
    enum: [
      "IT",
      "Marketing",
      "Finance",
      "Sales",
      "Engineering",
      "Design",
      "HR",
      "Other",
    ],
    default: "Other",
  },
  status: {
    type: String,
    enum: ["active", "closed", "draft"],
    default: "active",
  },
  benefits: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr) {
        return arr.every((item) => typeof item === "string" && item.length > 0);
      },
      message: "Lợi ích phải là mảng các chuỗi không rỗng",
    },
  },
  workHours: {
    type: String,
    default: "9 AM - 5 PM",
    trim: true,
  },
  closingDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !value || value > new Date();
      },
      message: "Ngày hết hạn phải lớn hơn ngày hiện tại",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Cập nhật updatedAt trước khi save
JobSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index để tìm kiếm nhanh
JobSchema.index({ title: "text", description: "text" });
JobSchema.index({ company: 1, status: 1, closingDate: 1 });

module.exports = mongoose.model("Job", JobSchema);