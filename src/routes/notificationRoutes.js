const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// Routes cho user thường
router.get("/", notificationController.getNotifications);
router.get("/stats", notificationController.getNotificationStats);
router.get("/unread-count", notificationController.getUnreadCount);
router.get("/:notificationId", notificationController.getNotificationById);
router.put("/:notificationId/read", notificationController.markAsRead);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.delete("/:notificationId", notificationController.deleteNotification);
router.delete("/read/delete-all", notificationController.deleteAllRead);

// Routes cho admin/system (cần quyền admin)
router.post("/send", authorizeRole(['admin']), notificationController.sendNotification);
router.post("/send-bulk", authorizeRole(['admin']), notificationController.sendBulkNotification);

module.exports = router;

