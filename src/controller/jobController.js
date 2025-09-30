const jobService = require("../services/jobService");

const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      description,
      requirements,
      location,
      salary,
      jobType,
      experienceLevel,
      category,
      status,
      benefits,
      workHours,
      closingDate,
    } = req.body;

    if (!title || !location || !salary?.min || !salary?.max || !closingDate) {
      throw new Error("Thiếu các trường bắt buộc: tiêu đề, địa điểm, lương, hoặc hạn nộp!");
    }

    const job = await jobService.createJob({
      userId,
      title,
      description,
      requirements,
      location,
      salary,
      jobType,
      experienceLevel,
      category,
      status,
      benefits,
      workHours,
      closingDate,
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;
    const {
      title,
      description,
      requirements,
      location,
      salary,
      jobType,
      experienceLevel,
      category,
      status,
      benefits,
      workHours,
      closingDate,
    } = req.body;

    await jobService.checkJobOwnership(jobId, userId);

    // Lấy thông tin job cũ để so sánh status
    const oldJob = await jobService.getJobById(jobId);
    const oldStatus = oldJob.status;

    const updatedJob = await jobService.updateJob(jobId, {
      title,
      description,
      requirements,
      location,
      salary,
      jobType,
      experienceLevel,
      category,
      status,
      benefits,
      workHours,
      closingDate,
    });

    // Gửi thông báo nếu status thay đổi
    if (status && status !== oldStatus) {
      try {
        const notificationService = require("../services/notificationService");
        await notificationService.notifyJobStatusChange(jobId, updatedJob.title, status);

        // Gửi thông báo real-time qua WebSocket
        const sendNotificationToUser = req.app.get('sendNotificationToUser');
        if (sendNotificationToUser) {
          const notification = {
            id: Date.now().toString(),
            type: 'JOB_UPDATE',
            message: `Công việc "${updatedJob.title}" đã ${status === 'active' ? 'được kích hoạt' : 'bị đóng'}`,
            createdAt: new Date().toISOString(),
            isRead: false,
            data: {
              jobId,
              jobTitle: updatedJob.title,
              status
            }
          };
          
          sendNotificationToUser(userId, notification);
        }
      } catch (notificationError) {
        console.error("Error sending job status notification:", notificationError);
      }
    }

    res.status(200).json({ success: true, data: updatedJob });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Các hàm khác giữ nguyên
const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await jobService.getAllJobs(parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, data: result.jobs, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const searchJobs = async (req, res) => {
  try {
    const { keyword, category, jobType, experienceLevel, location, status } = req.query;

    const jobs = await jobService.searchJobs({
      keyword,
      category,
      jobType,
      experienceLevel,
      location,
      status,
    });

    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getJobsByCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const jobs = await jobService.getAllJobsByCompany(companyId);
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await jobService.getJobById(req.params.jobId);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;

    await jobService.checkJobOwnership(jobId, userId);

    await jobService.deleteJob(jobId);
    res.status(200).json({ success: true, message: "Công việc đã bị xóa!" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const saveJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;

    const result = await jobService.saveJob(userId, jobId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const unsaveJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;

    const result = await jobService.unsaveJob(userId, jobId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const result = await jobService.getSavedJobs(userId, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, data: result.jobs, pagination: result.pagination });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getApplicationCount = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const count = await jobService.getApplicationCount(jobId);
    res.status(200).json({ success: true, data: { applicationCount: count } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markJobAsViewed = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;

    const result = await jobService.markJobAsViewed(userId, jobId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getViewedJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const result = await jobService.getViewedJobs(userId, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, data: result.jobs, pagination: result.pagination });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  searchJobs,
  getJobsByCompany,
  getJobById,
  updateJob,
  deleteJob,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getApplicationCount,
  markJobAsViewed,
  getViewedJobs,
};