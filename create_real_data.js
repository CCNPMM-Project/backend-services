/**
 * Script tạo dữ liệu thực cho hệ thống thống kê
 * Chạy: node create_real_data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const Job = require('./src/models/Job');
const Application = require('./src/models/Application');

// Dữ liệu mẫu
const companies = [
  {
    name: "Tech Corp",
    description: "Công ty công nghệ hàng đầu Việt Nam",
    location: "Hà Nội",
    website: "https://techcorp.vn"
  },
  {
    name: "FPT Software",
    description: "Tập đoàn công nghệ thông tin lớn nhất Việt Nam",
    location: "TP.HCM",
    website: "https://fpt-software.com"
  },
  {
    name: "Viettel",
    description: "Tập đoàn viễn thông và công nghệ",
    location: "Hà Nội",
    website: "https://viettel.com.vn"
  },
  {
    name: "VinGroup",
    description: "Tập đoàn đa ngành hàng đầu Việt Nam",
    location: "Hà Nội",
    website: "https://vingroup.net"
  },
  {
    name: "Shopee",
    description: "Nền tảng thương mại điện tử hàng đầu",
    location: "TP.HCM",
    website: "https://shopee.vn"
  }
];

const jobs = [
  {
    title: "Senior Frontend Developer",
    description: "Phát triển giao diện người dùng với React, Vue.js. Yêu cầu 3+ năm kinh nghiệm.",
    requirements: ["React.js", "Vue.js", "TypeScript", "CSS/SCSS", "3+ năm kinh nghiệm"],
    location: "Hà Nội",
    salary: { min: 25000000, max: 40000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "senior",
    category: "IT",
    benefits: ["Bảo hiểm sức khỏe", "Lương tháng 13", "Nghỉ phép có lương"],
    workHours: "9:00 - 18:00"
  },
  {
    title: "Backend Developer (Node.js)",
    description: "Phát triển API và hệ thống backend với Node.js, MongoDB.",
    requirements: ["Node.js", "Express.js", "MongoDB", "REST API", "2+ năm kinh nghiệm"],
    location: "TP.HCM",
    salary: { min: 20000000, max: 35000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "mid-level",
    category: "IT",
    benefits: ["Laptop công ty", "Đào tạo kỹ năng", "Thưởng dự án"],
    workHours: "8:30 - 17:30"
  },
  {
    title: "UI/UX Designer",
    description: "Thiết kế giao diện và trải nghiệm người dùng cho các sản phẩm digital.",
    requirements: ["Figma", "Adobe XD", "Photoshop", "Illustrator", "Portfolio"],
    location: "Hà Nội",
    salary: { min: 15000000, max: 25000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "mid-level",
    category: "Design",
    benefits: ["Máy Mac", "Khóa học design", "Thưởng sáng tạo"],
    workHours: "9:00 - 18:00"
  },
  {
    title: "Data Analyst",
    description: "Phân tích dữ liệu và tạo báo cáo cho ban lãnh đạo.",
    requirements: ["Python", "SQL", "Excel", "Tableau", "1+ năm kinh nghiệm"],
    location: "TP.HCM",
    salary: { min: 12000000, max: 20000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "junior",
    category: "IT",
    benefits: ["Khóa học data science", "Làm việc linh hoạt"],
    workHours: "8:00 - 17:00"
  },
  {
    title: "Marketing Manager",
    description: "Quản lý chiến lược marketing và quảng cáo cho sản phẩm.",
    requirements: ["Digital Marketing", "Google Ads", "Facebook Ads", "Analytics", "3+ năm kinh nghiệm"],
    location: "Hà Nội",
    salary: { min: 18000000, max: 30000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "senior",
    category: "Marketing",
    benefits: ["Thưởng KPI", "Du lịch công ty", "Khóa học marketing"],
    workHours: "9:00 - 18:00"
  },
  {
    title: "DevOps Engineer",
    description: "Quản lý hạ tầng cloud và CI/CD pipeline.",
    requirements: ["AWS", "Docker", "Kubernetes", "Jenkins", "Linux"],
    location: "TP.HCM",
    salary: { min: 22000000, max: 35000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "mid-level",
    category: "IT",
    benefits: ["Chứng chỉ AWS", "Làm việc remote", "Thưởng hiệu suất"],
    workHours: "Linh hoạt"
  },
  {
    title: "Sales Executive",
    description: "Tìm kiếm và chăm sóc khách hàng doanh nghiệp.",
    requirements: ["Kỹ năng giao tiếp", "Tiếng Anh", "Kinh nghiệm bán hàng", "CRM"],
    location: "Hà Nội",
    salary: { min: 10000000, max: 20000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "junior",
    category: "Sales",
    benefits: ["Hoa hồng cao", "Xe công ty", "Du lịch thưởng"],
    workHours: "8:30 - 17:30"
  },
  {
    title: "Mobile Developer (React Native)",
    description: "Phát triển ứng dụng di động với React Native.",
    requirements: ["React Native", "JavaScript", "iOS/Android", "Redux", "2+ năm kinh nghiệm"],
    location: "TP.HCM",
    salary: { min: 18000000, max: 30000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "mid-level",
    category: "IT",
    benefits: ["iPhone/Android test", "Khóa học mobile", "Thưởng app store"],
    workHours: "9:00 - 18:00"
  },
  {
    title: "HR Manager",
    description: "Quản lý nhân sự và tuyển dụng cho công ty.",
    requirements: ["Kinh nghiệm HR", "Tuyển dụng", "Luật lao động", "Tiếng Anh"],
    location: "Hà Nội",
    salary: { min: 15000000, max: 25000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "senior",
    category: "HR",
    benefits: ["Khóa học HR", "Thưởng tuyển dụng", "Làm việc linh hoạt"],
    workHours: "8:30 - 17:30"
  },
  {
    title: "QA Engineer",
    description: "Kiểm thử phần mềm và đảm bảo chất lượng sản phẩm.",
    requirements: ["Manual Testing", "Automation Testing", "Selenium", "JIRA", "1+ năm kinh nghiệm"],
    location: "TP.HCM",
    salary: { min: 12000000, max: 20000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "junior",
    category: "IT",
    benefits: ["Khóa học testing", "Thưởng bug", "Làm việc remote"],
    workHours: "9:00 - 18:00"
  },
  {
    title: "Product Manager",
    description: "Quản lý sản phẩm và định hướng phát triển.",
    requirements: ["Product Management", "Agile", "Analytics", "Tiếng Anh", "3+ năm kinh nghiệm"],
    location: "Hà Nội",
    salary: { min: 25000000, max: 40000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "senior",
    category: "IT",
    benefits: ["Thưởng sản phẩm", "Khóa học PM", "Du lịch nước ngoài"],
    workHours: "Linh hoạt"
  },
  {
    title: "Content Writer",
    description: "Viết nội dung marketing và blog cho website.",
    requirements: ["Tiếng Anh tốt", "SEO", "WordPress", "Kinh nghiệm viết", "Portfolio"],
    location: "TP.HCM",
    salary: { min: 8000000, max: 15000000, currency: "VND" },
    jobType: "part-time",
    experienceLevel: "junior",
    category: "Marketing",
    benefits: ["Làm việc remote", "Thưởng content viral", "Khóa học writing"],
    workHours: "Linh hoạt"
  },
  {
    title: "System Administrator",
    description: "Quản trị hệ thống và bảo mật mạng.",
    requirements: ["Windows Server", "Linux", "Network", "Security", "2+ năm kinh nghiệm"],
    location: "Hà Nội",
    salary: { min: 15000000, max: 25000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "mid-level",
    category: "IT",
    benefits: ["Chứng chỉ Microsoft", "Thưởng uptime", "Làm việc 24/7"],
    workHours: "Ca kíp"
  },
  {
    title: "Business Analyst",
    description: "Phân tích nghiệp vụ và yêu cầu dự án.",
    requirements: ["Business Analysis", "UML", "SQL", "Tiếng Anh", "2+ năm kinh nghiệm"],
    location: "TP.HCM",
    salary: { min: 16000000, max: 26000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "mid-level",
    category: "IT",
    benefits: ["Khóa học BA", "Thưởng dự án", "Làm việc với khách hàng"],
    workHours: "9:00 - 18:00"
  },
  {
    title: "Customer Success Manager",
    description: "Chăm sóc khách hàng và tăng trưởng doanh thu.",
    requirements: ["Customer Service", "CRM", "Tiếng Anh", "Kỹ năng giao tiếp"],
    location: "Hà Nội",
    salary: { min: 12000000, max: 20000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "junior",
    category: "Sales",
    benefits: ["Thưởng retention", "Khóa học CS", "Làm việc linh hoạt"],
    workHours: "8:30 - 17:30"
  },
  {
    title: "Full Stack Developer",
    description: "Phát triển full-stack với React và Node.js.",
    requirements: ["React", "Node.js", "MongoDB", "JavaScript", "2+ năm kinh nghiệm"],
    location: "TP.HCM",
    salary: { min: 20000000, max: 35000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "mid-level",
    category: "IT",
    benefits: ["Laptop gaming", "Khóa học full-stack", "Thưởng dự án"],
    workHours: "9:00 - 18:00"
  },
  {
    title: "Digital Marketing Specialist",
    description: "Chạy quảng cáo Google, Facebook và SEO.",
    requirements: ["Google Ads", "Facebook Ads", "SEO", "Analytics", "1+ năm kinh nghiệm"],
    location: "Hà Nội",
    salary: { min: 10000000, max: 18000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "junior",
    category: "Marketing",
    benefits: ["Thưởng ROAS", "Khóa học marketing", "Làm việc remote"],
    workHours: "9:00 - 18:00"
  },
  {
    title: "Cloud Engineer",
    description: "Quản lý hạ tầng cloud AWS và Azure.",
    requirements: ["AWS", "Azure", "Terraform", "Docker", "3+ năm kinh nghiệm"],
    location: "TP.HCM",
    salary: { min: 25000000, max: 40000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "senior",
    category: "IT",
    benefits: ["Chứng chỉ AWS", "Thưởng cost optimization", "Làm việc remote"],
    workHours: "Linh hoạt"
  },
  {
    title: "Technical Writer",
    description: "Viết tài liệu kỹ thuật và hướng dẫn sử dụng.",
    requirements: ["Tiếng Anh tốt", "Kỹ thuật", "Markdown", "Git", "Portfolio"],
    location: "Hà Nội",
    salary: { min: 10000000, max: 18000000, currency: "VND" },
    jobType: "contract",
    experienceLevel: "junior",
    category: "IT",
    benefits: ["Làm việc remote", "Thưởng documentation", "Khóa học technical writing"],
    workHours: "Linh hoạt"
  },
  {
    title: "AI/ML Engineer",
    description: "Phát triển mô hình AI và machine learning.",
    requirements: ["Python", "TensorFlow", "PyTorch", "ML", "2+ năm kinh nghiệm"],
    location: "TP.HCM",
    salary: { min: 30000000, max: 50000000, currency: "VND" },
    jobType: "full-time",
    experienceLevel: "senior",
    category: "IT",
    benefits: ["GPU workstation", "Khóa học AI", "Thưởng model accuracy"],
    workHours: "9:00 - 18:00"
  }
];

const candidates = [
  { email: "nguyenvanan@gmail.com", fullName: "Nguyễn Văn An", role: "candidate" },
  { email: "tranthibinh@gmail.com", fullName: "Trần Thị Bình", role: "candidate" },
  { email: "levanminh@gmail.com", fullName: "Lê Văn Minh", role: "candidate" },
  { email: "phamthithao@gmail.com", fullName: "Phạm Thị Thảo", role: "candidate" },
  { email: "hoangvanhuy@gmail.com", fullName: "Hoàng Văn Huy", role: "candidate" },
  { email: "vuthithuy@gmail.com", fullName: "Vũ Thị Thúy", role: "candidate" },
  { email: "dangvanlong@gmail.com", fullName: "Đặng Văn Long", role: "candidate" },
  { email: "buthithu@gmail.com", fullName: "Bùi Thị Thu", role: "candidate" },
  { email: "nguyenvantien@gmail.com", fullName: "Nguyễn Văn Tiến", role: "candidate" },
  { email: "trinhthimy@gmail.com", fullName: "Trịnh Thị Mỹ", role: "candidate" },
  { email: "lethithanh@gmail.com", fullName: "Lê Thị Thanh", role: "candidate" },
  { email: "phamvanhoa@gmail.com", fullName: "Phạm Văn Hòa", role: "candidate" },
  { email: "nguyenthithu@gmail.com", fullName: "Nguyễn Thị Thu", role: "candidate" },
  { email: "tranvanphong@gmail.com", fullName: "Trần Văn Phong", role: "candidate" },
  { email: "levanquang@gmail.com", fullName: "Lê Văn Quang", role: "candidate" }
];

async function createRealData() {
  try {
    // Kết nối MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/jobify");
    console.log('✅ Kết nối MongoDB thành công');

    // Xóa dữ liệu cũ
    console.log('🗑️ Xóa dữ liệu cũ...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    console.log('✅ Đã xóa dữ liệu cũ');

    // Tạo users (recruiters)
    console.log('👥 Tạo users...');
    const hashedPassword = await bcrypt.hash('1', 10);
    
    const recruiter1 = new User({
      email: 'pthngws@gmail.com',
      password: hashedPassword,
      fullName: 'Phạm Thị Hương',
      role: 'recruit',
      avatarUrl: 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'
    });
    await recruiter1.save();

    const recruiter2 = new User({
      email: 'thanghoctoeic@gmail.com',
      password: hashedPassword,
      fullName: 'Nguyễn Văn Thắng',
      role: 'recruit',
      avatarUrl: 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'
    });
    await recruiter2.save();

    // Tạo candidates
    const candidateUsers = [];
    for (const candidate of candidates) {
      const user = new User({
        email: candidate.email,
        password: hashedPassword,
        fullName: candidate.fullName,
        role: 'candidate',
        avatarUrl: 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'
      });
      await user.save();
      candidateUsers.push(user);
    }
    console.log('✅ Đã tạo users');

    // Tạo companies
    console.log('🏢 Tạo companies...');
    const createdCompanies = [];
    
    for (let i = 0; i < companies.length; i++) {
      const company = new Company({
        name: companies[i].name,
        description: companies[i].description,
        location: companies[i].location,
        website: companies[i].website,
        recruiter: i % 2 === 0 ? recruiter1._id : recruiter2._id
      });
      await company.save();
      createdCompanies.push(company);
    }
    console.log('✅ Đã tạo companies');

    // Cập nhật recruiter với company
    recruiter1.company = createdCompanies[0]._id;
    recruiter2.company = createdCompanies[1]._id;
    await recruiter1.save();
    await recruiter2.save();

    // Tạo jobs
    console.log('💼 Tạo jobs...');
    const createdJobs = [];
    
    for (let i = 0; i < jobs.length; i++) {
      const job = new Job({
        ...jobs[i],
        company: createdCompanies[i % createdCompanies.length]._id,
        closingDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000) // 90 ngày tới
      });
      await job.save();
      createdJobs.push(job);
    }
    console.log('✅ Đã tạo jobs');

    // Tạo applications và views
    console.log('📝 Tạo applications và views...');
    
    for (const job of createdJobs) {
      // Tạo applications (1-5 applications per job)
      const numApplications = Math.floor(Math.random() * 5) + 1;
      const selectedCandidates = candidateUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, numApplications);

      for (const candidate of selectedCandidates) {
        const application = new Application({
          job: job._id,
          applicant: candidate._id,
          coverLetter: `Tôi rất quan tâm đến vị trí ${job.title} tại ${job.company.name}. Với kinh nghiệm và kỹ năng của mình, tôi tin rằng mình sẽ đóng góp tích cực cho công ty.`,
          status: ['pending', 'accepted', 'rejected'][Math.floor(Math.random() * 3)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 30 ngày trước
        });
        await application.save();
      }

      // Tạo views (5-50 views per job)
      const numViews = Math.floor(Math.random() * 46) + 5;
      const selectedViewers = candidateUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, numViews);

      for (const viewer of selectedViewers) {
        // Thêm job vào viewedJobs của user
        viewer.viewedJobs.push({
          job: job._id,
          viewedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 30 ngày trước
        });
        await viewer.save();
      }
    }
    console.log('✅ Đã tạo applications và views');

    console.log('\n🎉 Hoàn thành tạo dữ liệu thực!');
    console.log(`📊 Thống kê:`);
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Companies: ${await Company.countDocuments()}`);
    console.log(`- Jobs: ${await Job.countDocuments()}`);
    console.log(`- Applications: ${await Application.countDocuments()}`);
    
    console.log('\n🔑 Tài khoản test:');
    console.log('Recruiter 1: pthngws@gmail.com / 1');
    console.log('Recruiter 2: thanghoctoeic@gmail.com / 1');
    console.log('Candidates: nguyenvanan@gmail.com / 1, tranthibinh@gmail.com / 1, ...');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

createRealData();
