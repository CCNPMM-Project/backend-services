const mongoose = require("mongoose");

const StatsSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
    unique: true
  },
  totalApplications: {
    type: Number,
    default: 0
  },
  pendingApplications: {
    type: Number,
    default: 0
  },
  acceptedApplications: {
    type: Number,
    default: 0
  },
  rejectedApplications: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },
  applicationTimeline: [{
    date: {
      type: Date,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  viewTimeline: [{
    date: {
      type: Date,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index để tìm kiếm nhanh
StatsSchema.index({ job: 1 });
StatsSchema.index({ lastUpdated: 1 });

// Cập nhật lastUpdated trước khi save
StatsSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model("Stats", StatsSchema);
