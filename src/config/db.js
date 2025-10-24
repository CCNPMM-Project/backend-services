const mongoose = require("mongoose");

// Handle mongoose connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/jobify", {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    });
    console.log("✅ MongoDB connected!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    // Don't exit process, just log error
    console.log("⚠️ Continuing without MongoDB connection...");
  }
};

module.exports = connectDB;
