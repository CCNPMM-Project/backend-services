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

    res.status(200).json({ success: true, data: updatedJob });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Các hàm khác giữ nguyên
const getAllJobs = async (req, res) => {
  try {
    const jobs = await jobService.getAllJobs();
    res.status(200).json({ success: true, data: jobs });
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

module.exports = {
  createJob,
  getAllJobs,
  searchJobs,
  getJobsByCompany,
  getJobById,
  updateJob,
  deleteJob,
};