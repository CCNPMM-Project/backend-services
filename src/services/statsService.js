const Stats = require("../models/Stats");
const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");

class StatsService {
  // Tạo thống kê mới cho một job
  static async createJobStats(jobId) {
    try {
      // Kiểm tra job có tồn tại không
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error("Job không tồn tại");
      }

      // Lấy tất cả applications của job
      const applications = await Application.find({ job: jobId });
      
      // Tính toán các số liệu
      const totalApplications = applications.length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
      const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

      // Tạo timeline cho applications (30 ngày gần nhất)
      const applicationTimeline = await this.generateApplicationTimeline(jobId, 30);
      
      // Lấy dữ liệu views thực từ User model
      const viewData = await this.getRealViewData(jobId);
      const totalViews = viewData.totalViews;
      const viewTimeline = viewData.timeline;
      
      // Tạo stats record mới
      const stats = new Stats({
        job: jobId,
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        totalViews: totalViews,
        applicationTimeline,
        viewTimeline
      });

      await stats.save();
      return stats;
    } catch (error) {
      throw new Error(`Lỗi tạo thống kê: ${error.message}`);
    }
  }

  // Cập nhật thống kê cho một job (dùng khi có application mới)
  static async updateJobStats(jobId) {
    try {
      // Kiểm tra job có tồn tại không
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error("Job không tồn tại");
      }

      // Lấy tất cả applications của job
      const applications = await Application.find({ job: jobId });
      
      // Tính toán các số liệu
      const totalApplications = applications.length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
      const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

      // Tạo timeline cho applications (30 ngày gần nhất)
      const applicationTimeline = await this.generateApplicationTimeline(jobId, 30);
      
      // Lấy dữ liệu views thực từ User model
      const viewData = await this.getRealViewData(jobId);
      const totalViews = viewData.totalViews;
      const viewTimeline = viewData.timeline;
      
      // Tìm stats record (phải tồn tại)
      let stats = await Stats.findOne({ job: jobId });
      
      if (!stats) {
        throw new Error("Stats record không tồn tại, hãy tạo mới trước");
      }

      // Cập nhật dữ liệu
      stats.totalApplications = totalApplications;
      stats.pendingApplications = pendingApplications;
      stats.acceptedApplications = acceptedApplications;
      stats.rejectedApplications = rejectedApplications;
      stats.totalViews = totalViews;
      stats.applicationTimeline = applicationTimeline;
      stats.viewTimeline = viewTimeline;

      await stats.save();
      return stats;
    } catch (error) {
      throw new Error(`Lỗi cập nhật thống kê: ${error.message}`);
    }
  }

  // Lấy thống kê của một job
  static async getJobStats(jobId) {
    try {
      let stats = await Stats.findOne({ job: jobId });
      
      if (!stats) {
        // Nếu chưa có stats, tạo mới với dữ liệu thực
        stats = await this.createJobStats(jobId);
      }

      // Tính tỷ lệ chấp nhận
      const acceptanceRate = stats.totalApplications > 0 
        ? ((stats.acceptedApplications / stats.totalApplications) * 100).toFixed(1)
        : 0;

      // Chuẩn bị dữ liệu cho biểu đồ
      const chartData = this.prepareChartData(stats);

      return {
        basicStats: {
          totalApplications: stats.totalApplications,
          pendingApplications: stats.pendingApplications,
          acceptedApplications: stats.acceptedApplications,
          rejectedApplications: stats.rejectedApplications,
          totalViews: stats.totalViews,
          acceptanceRate: parseFloat(acceptanceRate)
        },
        chartData
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê: ${error.message}`);
    }
  }

  // Tạo timeline cho applications
  static async generateApplicationTimeline(jobId, days = 30) {
    const timeline = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Lấy applications trong khoảng thời gian
    const applications = await Application.find({
      job: jobId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Nhóm theo ngày
    const dailyCounts = {};
    applications.forEach(app => {
      const date = app.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Tạo timeline với tất cả các ngày
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      timeline.push({
        date: new Date(dateStr),
        count: dailyCounts[dateStr] || 0
      });
    }

    return timeline;
  }

  // Lấy dữ liệu views thực từ User model
  static async getRealViewData(jobId, days = 30) {
    try {
      // Lấy tất cả users đã xem job này
      const users = await User.find({
        'viewedJobs.job': jobId
      }).select('viewedJobs');

      // Tính tổng views
      let totalViews = 0;
      const viewTimeline = [];
      
      // Tạo timeline 30 ngày
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Khởi tạo timeline với 0 views
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        viewTimeline.push({
          date: new Date(d),
          count: 0
        });
      }

      // Đếm views theo ngày
      users.forEach(user => {
        user.viewedJobs.forEach(viewedJob => {
          if (viewedJob.job.toString() === jobId) {
            totalViews++;
            
            // Tìm ngày trong timeline và tăng count
            const viewDate = new Date(viewedJob.viewedAt);
            const dateStr = viewDate.toISOString().split('T')[0];
            
            const timelineItem = viewTimeline.find(item => 
              item.date.toISOString().split('T')[0] === dateStr
            );
            
            if (timelineItem) {
              timelineItem.count++;
            }
          }
        });
      });

      return {
        totalViews,
        timeline: viewTimeline
      };
    } catch (error) {
      console.error('Lỗi lấy dữ liệu views thực:', error);
      // Trả về dữ liệu mặc định nếu có lỗi
      return {
        totalViews: 0,
        timeline: await this.generateViewTimeline(jobId, days)
      };
    }
  }

  // Tạo timeline cho views (dữ liệu thực - bắt đầu với 0)
  static async generateViewTimeline(jobId, days = 30) {
    const timeline = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Tạo timeline với 0 views (dữ liệu thực sẽ được cập nhật khi có người xem)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      timeline.push({
        date: new Date(d),
        count: 0
      });
    }

    return timeline;
  }

  // Chuẩn bị dữ liệu cho biểu đồ
  static prepareChartData(stats) {
    return {
      applicationTimeline: stats.applicationTimeline.map(item => ({
        date: item.date.toISOString().split('T')[0],
        applications: item.count
      })),
      viewTimeline: stats.viewTimeline.map(item => ({
        date: item.date.toISOString().split('T')[0],
        views: item.count
      }))
    };
  }

  // Cập nhật lượt xem (sẽ được gọi khi có người xem job)
  static async incrementJobViews(jobId) {
    try {
      let stats = await Stats.findOne({ job: jobId });
      
      if (!stats) {
        stats = await this.updateJobStats(jobId);
      }

      stats.totalViews += 1;
      
      // Cập nhật view timeline cho ngày hôm nay
      const today = new Date().toISOString().split('T')[0];
      const todayView = stats.viewTimeline.find(item => 
        item.date.toISOString().split('T')[0] === today
      );
      
      if (todayView) {
        todayView.count += 1;
      } else {
        stats.viewTimeline.push({
          date: new Date(today),
          count: 1
        });
      }

      await stats.save();
      return stats;
    } catch (error) {
      throw new Error(`Lỗi cập nhật lượt xem: ${error.message}`);
    }
  }
}

module.exports = StatsService;
