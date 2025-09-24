const applicationService = require("../services/applicationService");
const jobService = require("../services/jobService")

// Tạo đơn ứng tuyển
const createApplication = async (req, res) => {
  try {
    const { job, coverLetter } = req.body;
    const applicant = req.user.userId;

    const application = await applicationService.createApplication(job, applicant, coverLetter);

    res.status(201).json({
      success: true,
      message: "Ứng tuyển thành công",
      data: application
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Lấy danh sách ứng viên bởi job
const getAllApplicationsByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;

    const userId = req.user.userId;

    await jobService.checkJobOwnership(jobId,userId)

    const applications = await applicationService.getAllApplicationsByJobId(jobId);

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Lấy danh sách ứng viên bởi ứng viên
const getAllApplicationsByJobApplicant = async (req, res) => {
  try {
    const { userId } = req.user;

    const applications = await applicationService.getApplicationsByApplicant(userId);

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Lấy cụ thể thông tin ứng tuyển
const getApplicationById = async (req, res) => {
  try {
    const { userId } = req.user;
    const {applicationId} = req.params;
    await applicationService.checkApplicationOwnership(applicationId,userId)

    const application = await applicationService.getApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn ứng tuyển!"
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Cập nhật trạng thái ứng tuyển của ứng viên
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { userId } = req.user;
    const {applicationId} = req.params;
    await applicationService.checkApplicationOwnership(applicationId,userId)
    const updatedApplication = await applicationService.updateApplicationStatus(applicationId, status);

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: updatedApplication
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Xóa đơn ứng tuyển
const deleteApplication = async (req, res) => {
  try {
    const { userId } = req.user;
    const {applicationId} = req.params;
    await applicationService.checkApplicationOwnership(applicationId,userId)
    await applicationService.deleteApplication(applicationId);

    res.status(200).json({
      success: true,
      message: "Đã xóa đơn ứng tuyển!"
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  createApplication,
  getAllApplicationsByJobId,
  getAllApplicationsByJobApplicant,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
};
