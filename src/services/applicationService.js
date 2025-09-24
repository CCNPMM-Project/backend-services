const Application = require("../models/Application");
const Job = require("../models/Job");

const checkApplicationOwnership = async (applicationId, userId) => {
  const application = await Application.findById(applicationId).populate("job");

  if (!application) {
    throw new Error("Đơn ứng tuyển không tồn tại!");
  }

  // Kiểm tra xem đơn ứng tuyển có thuộc về người dùng không (ứng viên)
  if (application.applicant.toString() !== userId) {

    // Kiểm tra xem người dùng có phải là recruiter của công ty đã đăng công việc này không
    const job = await Job.findById(application.job._id).populate("company");

    if (job.company.recruiter.toString() !== userId) {
      throw new Error("Bạn không có quyền truy cập đơn ứng tuyển này!");
    }
  }

  return application;
};

const createApplication = async (job, applicant, coverLetter) => {
  const existing = await Application.findOne({ job, applicant });

  if (existing) {
    throw new Error("Bạn đã ứng tuyển công việc này rồi.");
  }
  return await Application.create({ job, applicant, coverLetter });
};

const getAllApplicationsByJobId = async (jobId) => {
  return await Application.find({ job: jobId }).populate("applicant", "email fullName avatarUrl resumeUrl");
};

const getApplicationsByApplicant = async (applicantId) => {
  return await Application.find({ applicant: applicantId }).populate("applicant", "email fullName avatarUrl resumeUrl");
};

const getApplicationById = async (id) => {
  return await Application.findById(id).populate("job applicant");
};

const updateApplicationStatus = async (id, status) => {
  return await Application.findByIdAndUpdate(id, { status }, { new: true });
};

const deleteApplication = async (id) => {
  return await Application.findByIdAndDelete(id);
};

module.exports = {
  checkApplicationOwnership,
  createApplication,
  getAllApplicationsByJobId,
  getApplicationsByApplicant,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
};
