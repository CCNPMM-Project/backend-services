const redisClient = require("../config/redisClient");
const nodemailer = require("nodemailer");

// Tạo OTP ngẫu nhiên
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
};

// Gửi OTP qua email
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_USERNAME,
    to: email,
    subject: "Xác nhận đăng ký",
    text: `Mã OTP của bạn là: ${otp}. Hết hạn sau 5 phút.`,
  });
};

// Lưu OTP vào Redis
const storeOtp = async (email, password, role) => {
  const otp = generateOtp();
  await redisClient.set(`otp:${email}`, JSON.stringify({ otp, email, password, role }), {
    EX: 300, 
  });
  await sendOtpEmail(email, otp);
};

const verifyOtp = async (email, otp) => {

    const data = await redisClient.get(`otp:${email}`);
    if (!data) {
      throw new Error("OTP hết hạn hoặc không hợp lệ!");
    }

    const { otp: storedOtp, password, role } = JSON.parse(data);
  
    if (otp !== storedOtp) {
      throw new Error("OTP không đúng!");
    }
  
    await redisClient.del(`otp:${email}`);
  
    return { email, password, role };
  };

  const storeOtpResetPassword = async (email)=>
  {
    const otp = generateOtp();
    await redisClient.set(`otp:${email}`, JSON.stringify({ otp }), {
      EX: 300, // Hết hạn sau 5 phút
    });
    await sendOtpEmail(email,otp);
  }
  

module.exports = { storeOtp, verifyOtp,storeOtpResetPassword };
