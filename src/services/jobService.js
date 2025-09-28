const Job = require("../models/Job");
const User = require("../models/User");

const checkJobOwnership = async (jobId, userId) => {
  const job = await Job.findById(jobId).populate("company");
  if (!job) {
    throw new Error("Công việc không tồn tại!");
  }

  if (!job.company.recruiter || job.company.recruiter.toString() !== userId) {
    throw new Error("Bạn không có quyền truy cập công việc này!");
  }

  return job;
};

const createJob = async ({
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
}) => {
  const user = await User.findById(userId);
  if (!user || !user.company) {
    throw new Error("Người dùng không tồn tại hoặc không có công ty liên kết!");
  }

  const job = await Job.create({
    title,
    description,
    requirements,
    company: user.company,
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

  return job;
};

const getAllJobs = async () => {
  return await Job.find().populate("company");
};

const getAllJobsByCompany = async (companyId) => {
  return await Job.find({ company: companyId }).populate("company");
};

const getJobById = async (jobId) => {
  const job = await Job.findById(jobId).populate("company");
  if (!job) {
    throw new Error("Công việc không tồn tại!");
  }
  return job;
};

const updateJob = async (
  jobId,
  {
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
  }
) => {
  const updateData = {
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
  };

  const updatedJob = await Job.findByIdAndUpdate(jobId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!updatedJob) {
    throw new Error("Không tìm thấy công việc để cập nhật!");
  }
  return updatedJob;
};

const deleteJob = async (jobId) => {
  const deletedJob = await Job.findByIdAndDelete(jobId);
  if (!deletedJob) {
    throw new Error("Không tìm thấy công việc để xóa!");
  }
  return deletedJob;
};

const searchJobs = async ({
  keyword,
  category,
  jobType,
  experienceLevel,
  location,
  status,
}) => {
  const query = {};

  if (keyword) {
    query.$text = { $search: keyword };
  }

  if (category) {
    query.category = category;
  }

  if (jobType) {
    query.jobType = jobType;
  }

  if (experienceLevel) {
    query.experienceLevel = experienceLevel;
  }

  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  if (status) {
    query.status = status;
  }

  return await Job.find(query).populate("company");
};

module.exports = {
  checkJobOwnership,
  createJob,
  getAllJobs,
  getAllJobsByCompany,
  getJobById,
  updateJob,
  deleteJob,
  searchJobs,
};