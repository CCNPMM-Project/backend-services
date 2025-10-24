const express = require("express");
const router = express.Router();
const StatsController = require("../controller/statsController");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");

// Middleware xác thực cho tất cả routes
router.use(authenticateToken);

// GET /api/stats/job/:jobId - Lấy thống kê của một job
router.get("/job/:jobId", authorizeRole(["recruit", "admin"]), StatsController.getJobStats);

// PUT /api/stats/job/:jobId/update - Cập nhật thống kê cho một job
router.put("/job/:jobId/update", authorizeRole(["recruit", "admin"]), StatsController.updateJobStats);

// GET /api/stats/jobs - Lấy thống kê của tất cả jobs của user
router.get("/jobs", authorizeRole(["recruit", "admin"]), StatsController.getAllJobStats);

// POST /api/stats/job/:jobId/reset - Reset stats với dữ liệu thực
router.post("/job/:jobId/reset", authorizeRole(["recruit", "admin"]), StatsController.resetJobStats);

// GET /api/stats/debug/job/:jobId - Debug endpoint để kiểm tra dữ liệu
router.get("/debug/job/:jobId", authenticateToken, StatsController.debugJobData);

// POST /api/stats/job/:jobId/view - Tăng lượt xem job (public, không cần auth)
router.post("/job/:jobId/view", StatsController.incrementJobViews);

module.exports = router;
