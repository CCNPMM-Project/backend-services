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

const getAllJobs = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const jobs = await Job.find()
    .populate("company")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Job.countDocuments();
  
  return {
    jobs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalJobs: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
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

const saveJob = async (userId, jobId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại!");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new Error("Công việc không tồn tại!");
  }

  if (user.savedJobs.includes(jobId)) {
    throw new Error("Công việc đã được lưu trước đó!");
  }

  user.savedJobs.push(jobId);
  await user.save();

  return { message: "Đã lưu công việc thành công!" };
};

const unsaveJob = async (userId, jobId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại!");
  }

  if (!user.savedJobs.includes(jobId)) {
    throw new Error("Công việc chưa được lưu!");
  }

  user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
  await user.save();

  return { message: "Đã bỏ lưu công việc thành công!" };
};

const getSavedJobs = async (userId, page = 1, limit = 10) => {
  const user = await User.findById(userId).populate({
    path: 'savedJobs',
    populate: {
      path: 'company'
    }
  });

  if (!user) {
    throw new Error("Người dùng không tồn tại!");
  }

  const skip = (page - 1) * limit;
  const savedJobs = user.savedJobs.slice(skip, skip + limit);
  const total = user.savedJobs.length;

  return {
    jobs: savedJobs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalJobs: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
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
  saveJob,
  unsaveJob,
  getSavedJobs,
};