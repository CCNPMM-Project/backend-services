const nodemailer = require('nodemailer');
const User = require('../models/User');

/**
 * Email Service - Xử lý gửi email thông báo
 * Hỗ trợ gửi email cho các loại thông báo khác nhau
 */

// Cấu hình transporter cho email
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Gửi email thông báo đơn giản
 * @param {string} to - Email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} htmlContent - Nội dung HTML
 * @param {string} textContent - Nội dung text (fallback)
 */
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Jobify System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tạo template HTML cho email thông báo
 * @param {Object} notification - Thông báo
 * @param {Object} user - Thông tin user
 */
const createEmailTemplate = (notification, user) => {
  const { title, message, type, data } = notification;
  const { firstName, lastName } = user;
  
  // Template base
  let template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .notification-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .priority-high { border-left: 4px solid #EF4444; }
        .priority-medium { border-left: 4px solid #F59E0B; }
        .priority-low { border-left: 4px solid #10B981; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .btn { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Thông báo từ Jobify</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${firstName} ${lastName}</strong>,</p>
          
          <div class="notification-card priority-${notification.priority || 'medium'}">
            <h2>${title}</h2>
            <p>${message}</p>
  `;

  // Thêm nội dung cụ thể theo loại thông báo
  switch (type) {
    case 'application_status':
      if (data.jobTitle) {
        template += `
          <p><strong>Công việc:</strong> ${data.jobTitle}</p>
          <p><strong>Trạng thái:</strong> ${data.status === 'accepted' ? '✅ Được chấp nhận' : '❌ Bị từ chối'}</p>
        `;
      }
      break;
      
    case 'job_match':
      if (data.jobTitle && data.companyName) {
        template += `
          <p><strong>Công việc phù hợp:</strong> ${data.jobTitle}</p>
          <p><strong>Công ty:</strong> ${data.companyName}</p>
          <p><strong>Mức lương:</strong> ${data.salary || 'Thỏa thuận'}</p>
        `;
      }
      break;
      
    case 'new_applicant':
      if (data.jobTitle && data.applicantName) {
        template += `
          <p><strong>Vị trí:</strong> ${data.jobTitle}</p>
          <p><strong>Ứng viên:</strong> ${data.applicantName}</p>
        `;
      }
      break;
      
    case 'job_expiring':
      if (data.jobTitle && data.daysLeft) {
        template += `
          <p><strong>Công việc:</strong> ${data.jobTitle}</p>
          <p><strong>Còn lại:</strong> ${data.daysLeft} ngày</p>
        `;
      }
      break;
  }

  // Thêm nút hành động nếu có
  if (data.actionUrl) {
    template += `
      <p style="text-align: center; margin-top: 20px;">
        <a href="${data.actionUrl}" class="btn">Xem chi tiết</a>
      </p>
    `;
  }

  template += `
          </div>
          
          <p>Bạn có thể xem tất cả thông báo trong tài khoản của mình.</p>
          
          <div class="footer">
            <p>Trân trọng,<br>Đội ngũ Jobify</p>
            <p><small>Email này được gửi tự động, vui lòng không trả lời.</small></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return template;
};

/**
 * Gửi email thông báo cho user
 * @param {string} userId - ID của user
 * @param {Object} notification - Thông báo
 */
const sendNotificationEmail = async (userId, notification) => {
  try {
    // Lấy thông tin user
    const user = await User.findById(userId);
    if (!user || !user.email) {
      console.log(`User ${userId} not found or no email address`);
      return { success: false, error: 'User not found or no email' };
    }

    // Tạo template email
    const htmlContent = createEmailTemplate(notification, user);
    const textContent = `${notification.title}\n\n${notification.message}`;

    // Gửi email
    const result = await sendEmail(
      user.email,
      `🔔 ${notification.title}`,
      htmlContent,
      textContent
    );

    if (result.success) {
      // Cập nhật trạng thái email đã gửi
      const Notification = require('../models/Notification');
      await Notification.findByIdAndUpdate(notification._id, {
        emailSent: true,
        emailSentAt: new Date()
      });
    }

    return result;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gửi email hàng loạt cho nhiều user
 * @param {Array} userIds - Danh sách ID user
 * @param {Object} notificationTemplate - Template thông báo
 */
const sendBulkNotificationEmail = async (userIds, notificationTemplate) => {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) {
        results.push({ userId, success: false, error: 'No email address' });
        continue;
      }

      const notification = {
        ...notificationTemplate,
        user: userId
      };

      const result = await sendNotificationEmail(userId, notification);
      results.push({ userId, ...result });
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
    }
  }

  return results;
};

/**
 * Gửi email thống kê hàng tuần/tháng cho recruiter
 * @param {string} recruiterId - ID recruiter
 * @param {Object} stats - Thống kê
 * @param {string} period - 'weekly' hoặc 'monthly'
 */
const sendStatsEmail = async (recruiterId, stats, period = 'weekly') => {
  try {
    const user = await User.findById(recruiterId);
    if (!user || !user.email) {
      return { success: false, error: 'User not found or no email' };
    }

    const periodText = period === 'weekly' ? 'tuần' : 'tháng';
    const title = `📊 Báo cáo thống kê ${periodText}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 20px 0; }
          .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-number { font-size: 2em; font-weight: bold; color: #4F46E5; }
          .stat-label { color: #666; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Báo cáo thống kê ${periodText}</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${user.firstName} ${user.lastName}</strong>,</p>
            <p>Dưới đây là báo cáo thống kê hoạt động ${periodText} của bạn:</p>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${stats.totalApplications || 0}</div>
                <div class="stat-label">Đơn ứng tuyển</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.newJobs || 0}</div>
                <div class="stat-label">Công việc mới</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.profileViews || 0}</div>
                <div class="stat-label">Lượt xem hồ sơ</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.acceptedApplications || 0}</div>
                <div class="stat-label">Ứng viên được chấp nhận</div>
              </div>
            </div>
            
            <p>Trân trọng,<br>Đội ngũ Jobify</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail(user.email, title, htmlContent);
    return result;
  } catch (error) {
    console.error('Error sending stats email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendBulkNotificationEmail,
  sendStatsEmail,
  createEmailTemplate
};



