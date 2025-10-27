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

  // Kiểm tra user có active không
  if (!user.isActive) {
    throw new Error("Tài khoản của bạn đã bị vô hiệu hóa!");
  }

  // Kiểm tra company có active không
  const Company = require("../models/Company");
  const company = await Company.findById(user.company);
  if (!company || !company.isActive) {
    throw new Error("Công ty của bạn đã bị vô hiệu hóa!");
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
  const jobs = await Job.find({ status: 'active' })
    .populate("company")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Job.countDocuments({ status: 'active' });
  
  // Thêm số lượng ứng viên cho mỗi job
  const Application = require("../models/Application");
  const jobsWithApplicationCount = await Promise.all(
    jobs.map(async (job) => {
      const applicationCount = await Application.countDocuments({ job: job._id });
      return {
        ...job.toObject(),
        applicationCount
      };
    })
  );
  
  return {
    jobs: jobsWithApplicationCount,
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

  // Improved keyword search: use regex for more reliable matching
  if (keyword) {
    // Use regex instead of text search for better matching with short keywords like "AI"
    query.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } }
    ];
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
    console.log('[JOB_SEARCH] Location provided:', location);
    
    // Add location condition properly
    const locationRegex = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    if (query.$or) {
      // If there's already $or from keyword, we need to combine with location
      query.$and = [
        { $or: query.$or },
        { location: locationRegex }
      ];
      delete query.$or;
    } else {
      // Just add location regex
      query.location = locationRegex;
    }
    console.log('[JOB_SEARCH] Location regex:', locationRegex);
  }

  if (status) {
    query.status = status;
  }

  console.log('[JOB_SEARCH] Query:', JSON.stringify(query, null, 2));
  
  const results = await Job.find(query).populate("company");
  console.log('[JOB_SEARCH] Found', results.length, 'results');
  
  if (results.length > 0) {
    console.log('[JOB_SEARCH] Sample job titles:', results.slice(0, 3).map(j => j.title));
  }
  
  return results;
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

const getApplicationCount = async (jobId) => {
  const Application = require("../models/Application");
  const count = await Application.countDocuments({ job: jobId });
  return count;
};

const markJobAsViewed = async (userId, jobId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại!");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new Error("Công việc không tồn tại!");
  }

  // Kiểm tra xem job đã được xem chưa
  const alreadyViewed = user.viewedJobs.some(
    viewedJob => viewedJob.job.toString() === jobId
  );

  if (!alreadyViewed) {
    user.viewedJobs.push({
      job: jobId,
      viewedAt: new Date()
    });
    await user.save();
  }

  return { message: "Đã đánh dấu công việc đã xem!" };
};

const getViewedJobs = async (userId, page = 1, limit = 10) => {
  const user = await User.findById(userId).populate({
    path: 'viewedJobs.job',
    populate: {
      path: 'company'
    }
  });

  if (!user) {
    throw new Error("Người dùng không tồn tại!");
  }

  const skip = (page - 1) * limit;
  const viewedJobs = user.viewedJobs
    .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
    .slice(skip, skip + limit)
    .map(item => item.job)
    .filter(job => job !== null); // Lọc bỏ job đã bị xóa

  const total = user.viewedJobs.length;

  return {
    jobs: viewedJobs,
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
  getApplicationCount,
  markJobAsViewed,
  getViewedJobs,
};