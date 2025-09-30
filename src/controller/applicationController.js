const applicationService = require("../services/applicationService");
const jobService = require("../services/jobService");
const notificationService = require("../services/notificationService");

// Tạo đơn ứng tuyển
const createApplication = async (req, res) => {
  try {
    const { job, coverLetter } = req.body;
    const applicant = req.user.userId;

    const application = await applicationService.createApplication(job, applicant, coverLetter);

    // Gửi thông báo real-time cho recruiter
    try {
      const Job = require("../models/Job");
      const jobData = await Job.findById(job).populate("company");
      
      if (jobData && jobData.company.recruiter) {
        // Tạo thông báo trong database
        await notificationService.notifyNewApplication(
          job, 
          applicant, 
          jobData.title, 
          jobData.company.name
        );

        // Gửi thông báo real-time qua WebSocket
        const sendNotificationToUser = req.app.get('sendNotificationToUser');
        console.log('🔍 sendNotificationToUser function:', typeof sendNotificationToUser);
        if (sendNotificationToUser) {
          const notification = {
            id: Date.now().toString(),
            type: 'NEW_APPLICATION',
            message: `Có ứng viên mới ứng tuyển vào vị trí "${jobData.title}"`,
            createdAt: new Date().toISOString(),
            isRead: false,
            data: {
              jobId: job,
              applicantId: applicant,
              jobTitle: jobData.title,
              companyName: jobData.company.name
            }
          };
          
          console.log('📤 Sending notification to user:', jobData.company.recruiter);
          sendNotificationToUser(jobData.company.recruiter, notification);
        } else {
          console.log('❌ sendNotificationToUser function not found');
        }
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Không throw error để không ảnh hưởng đến việc tạo application
    }

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

    // Gửi thông báo real-time cho ứng viên
    try {
      const Application = require("../models/Application");
      const application = await Application.findById(applicationId).populate('job applicant');
      
      if (application && application.applicant) {
        const statusText = status === "accepted" ? "được chấp nhận" : status === "rejected" ? "bị từ chối" : "được cập nhật";
        
        // Tạo thông báo trong database
        await notificationService.notifyApplicationStatusChange(
          applicationId,
          application.job.title,
          status,
          application.applicant._id
        );

        // Gửi thông báo real-time qua WebSocket
        const sendNotificationToUser = req.app.get('sendNotificationToUser');
        if (sendNotificationToUser) {
          const notification = {
            id: Date.now().toString(),
            type: 'APPLICATION_REVIEWED',
            message: `Đơn ứng tuyển cho "${application.job.title}" đã ${statusText}`,
            createdAt: new Date().toISOString(),
            isRead: false,
            data: {
              applicationId,
              jobTitle: application.job.title,
              status
            }
          };
          
          sendNotificationToUser(application.applicant._id, notification);
        }
      }
    } catch (notificationError) {
      console.error("Error sending application status notification:", notificationError);
    }

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
