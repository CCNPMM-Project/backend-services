const express = require("express");
const cors = require('cors');
const connectDB = require("./src/config/db");
const passport = require("./src/config/passport");
const session = require("express-session");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Nguồn frontend
    credentials: true, // Cho phép gửi cookie/credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Các phương thức được phép
    allowedHeaders: ["Content-Type", "Authorization"], // Các header được phép
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());



app.get("/", (req, res) => {
  res.json({ message: "Hello, world!" });
});

// Test WebSocket endpoint
app.get("/test-websocket", (req, res) => {
  const sendNotificationToUser = req.app.get('sendNotificationToUser');
  if (sendNotificationToUser) {
    const testNotification = {
      id: Date.now().toString(),
      type: 'TEST',
      message: 'Test notification from server',
      createdAt: new Date().toISOString(),
      isRead: false,
      data: {}
    };
    
    // Send to all connected users (for testing)
    sendNotificationToUser('test-user', testNotification);
    res.json({ 
      success: true, 
      message: "Test notification sent",
      notification: testNotification
    });
  } else {
    res.json({ 
      success: false, 
      message: "sendNotificationToUser function not found" 
    });
  }
});

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/jobs", require("./src/routes/jobRoutes"));
app.use("/api/applications", require("./src/routes/applicationRoutes"));
app.use("/api/companies", require("./src/routes/companyRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));


module.exports = app;
