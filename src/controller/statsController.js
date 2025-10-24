const StatsService = require("../services/statsService");
const Job = require("../models/Job");
const Company = require("../models/Company");
const Stats = require("../models/Stats");

class StatsController {
  // Lấy thống kê của một job
  static async getJobStats(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.userId;

      console.log('🔍 Debug - JobId:', jobId);
      console.log('🔍 Debug - UserId:', userId);
      console.log('🔍 Debug - User role:', req.user.role);

      // Kiểm tra job có tồn tại và thuộc về user không
      const job = await Job.findById(jobId).populate('company');
      if (!job) {
        console.log('❌ Job không tồn tại');
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy công việc"
        });
      }

      console.log('🔍 Debug - Job found:');
      console.log('- Job Title:', job.title);
      console.log('- Company ID:', job.company._id);
      console.log('- Company Name:', job.company.name);
      console.log('- Company Recruiter:', job.company.recruiter);
      console.log('- Recruiter Type:', typeof job.company.recruiter);
      console.log('- Recruiter toString:', job.company.recruiter.toString());
      console.log('- UserId Type:', typeof userId);
      console.log('- Comparison:', job.company.recruiter.toString() === userId);

      // Kiểm tra quyền truy cập (chỉ chủ công ty mới xem được stats)
      if (job.company.recruiter.toString() !== userId) {
        console.log('❌ Không có quyền truy cập - Recruiter không khớp');
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem thống kê công việc này",
          debug: {
            jobId: jobId,
            userId: userId,
            companyRecruiter: job.company.recruiter.toString(),
            comparison: job.company.recruiter.toString() === userId
          }
        });
      }

      // Lấy thống kê
      const stats = await StatsService.getJobStats(jobId);

      res.status(200).json({
        success: true,
        data: {
          job: {
            id: job._id,
            title: job.title,
            company: job.company.name
          },
          ...stats
        }
      });
    } catch (error) {
      console.error("Lỗi lấy thống kê job:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message
      });
    }
  }

  // Cập nhật thống kê cho một job (dùng khi có application mới)
  static async updateJobStats(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.userId;

      // Kiểm tra job có tồn tại và thuộc về user không
      const job = await Job.findById(jobId).populate('company');
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy công việc"
        });
      }

      if (job.company.recruiter.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật thống kê công việc này"
        });
      }

      // Cập nhật thống kê
      const stats = await StatsService.updateJobStats(jobId);

      res.status(200).json({
        success: true,
        message: "Cập nhật thống kê thành công",
        data: stats
      });
    } catch (error) {
      console.error("Lỗi cập nhật thống kê job:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật thống kê",
        error: error.message
      });
    }
  }

  // Tăng lượt xem job (public endpoint)
  static async incrementJobViews(req, res) {
    try {
      const { jobId } = req.params;

      // Kiểm tra job có tồn tại không
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy công việc"
        });
      }

      // Tăng lượt xem
      await StatsService.incrementJobViews(jobId);

      res.status(200).json({
        success: true,
        message: "Cập nhật lượt xem thành công"
      });
    } catch (error) {
      console.error("Lỗi cập nhật lượt xem job:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật lượt xem",
        error: error.message
      });
    }
  }

  // Lấy danh sách thống kê của tất cả jobs của user
  static async getAllJobStats(req, res) {
    try {
      const userId = req.user.userId;

      // Lấy tất cả jobs của user
      const jobs = await Job.find()
        .populate('company')
        .select('_id title company status createdAt')
        .then(jobs => jobs.filter(job => job.company && job.company.recruiter.toString() === userId));

      const statsPromises = jobs.map(async (job) => {
        try {
          const stats = await StatsService.getJobStats(job._id);
          return {
            job: {
              id: job._id,
              title: job.title,
              company: job.company.name,
              status: job.status,
              createdAt: job.createdAt
            },
            basicStats: stats.basicStats
          };
        } catch (error) {
          console.error(`Lỗi lấy stats cho job ${job._id}:`, error);
          return {
            job: {
              id: job._id,
              title: job.title,
              company: job.company.name,
              status: job.status,
              createdAt: job.createdAt
            },
            basicStats: {
              totalApplications: 0,
              pendingApplications: 0,
              acceptedApplications: 0,
              rejectedApplications: 0,
              totalViews: 0,
              acceptanceRate: 0
            }
          };
        }
      });

      const allStats = await Promise.all(statsPromises);

      res.status(200).json({
        success: true,
        data: allStats
      });
    } catch (error) {
      console.error("Lỗi lấy thống kê tất cả jobs:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message
      });
    }
  }

  // Reset stats để tạo dữ liệu thực
  static async resetJobStats(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.userId;

      // Kiểm tra job có tồn tại và thuộc về user không
      const job = await Job.findById(jobId).populate('company');
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy công việc"
        });
      }

      if (job.company.recruiter.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền reset thống kê công việc này"
        });
      }

      // Xóa stats cũ và tạo mới với dữ liệu thực
      await Stats.deleteOne({ job: jobId });
      const stats = await StatsService.updateJobStats(jobId);

      res.status(200).json({
        success: true,
        message: "Reset thống kê thành công với dữ liệu thực",
        data: stats
      });
    } catch (error) {
      console.error("Lỗi reset thống kê job:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi reset thống kê",
        error: error.message
      });
    }
  }

  // Endpoint debug để kiểm tra dữ liệu
  static async debugJobData(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.userId;

      console.log('🔍 Debug Job Data - JobId:', jobId);
      console.log('🔍 Debug Job Data - UserId:', userId);

      // Lấy job với company
      const job = await Job.findById(jobId).populate('company');
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job không tồn tại"
        });
      }

      // Lấy company trực tiếp
      const company = await Company.findById(job.company._id);

      res.status(200).json({
        success: true,
        debug: {
          jobId: jobId,
          userId: userId,
          job: {
            id: job._id,
            title: job.title,
            companyId: job.company._id
          },
          company: {
            id: company._id,
            name: company.name,
            recruiter: company.recruiter,
            recruiterType: typeof company.recruiter,
            recruiterToString: company.recruiter.toString()
          },
          comparison: {
            userIdType: typeof userId,
            recruiterType: typeof company.recruiter,
            isEqual: company.recruiter.toString() === userId,
            userIdValue: userId,
            recruiterValue: company.recruiter.toString()
          }
        }
      });
    } catch (error) {
      console.error("Lỗi debug job data:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi debug",
        error: error.message
      });
    }
  }
}

module.exports = StatsController;
