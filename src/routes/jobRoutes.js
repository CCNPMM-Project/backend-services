const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");

router.post("/", authenticateToken, authorizeRole(["recruit"]), jobController.createJob);
router.get("/", jobController.getAllJobs);
router.get("/search", jobController.searchJobs);
router.get("/:jobId", jobController.getJobById);
router.get("/company/:companyId", jobController.getJobsByCompany);
router.put("/:jobId", authenticateToken, authorizeRole(["recruit"]), jobController.updateJob);
router.delete("/:jobId", authenticateToken, authorizeRole(["recruit", "admin"]), jobController.deleteJob);

module.exports = router;