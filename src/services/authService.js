const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const redisClient = require("../config/redisClient");
require("dotenv").config();

const crypto = require("crypto");

const generateTokens = async (user) => {
  const sessionId = crypto.randomUUID(); // Mỗi thiết bị có 1 sessionId riêng

  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  const refreshToken = jwt.sign(
    { sessionId, userId: user._id, type: "refresh" }, 
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // Lưu danh sách refreshTokens theo userId
  const key = `refreshTokens:${user._id}`;
  await redisClient.sAdd(key, refreshToken);
  await redisClient.expire(key, 7 * 24 * 60 * 60); // Hết hạn sau 7 ngày

  return { accessToken, refreshToken };
};
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const key = `refreshTokens:${decoded.userId}`;

    // Kiểm tra xem refreshToken có hợp lệ không
    const isValid = await redisClient.sIsMember(key, refreshToken);
    if (!isValid) {
      throw new Error("Refresh Token không hợp lệ!");
    }

    // Lấy thông tin user từ DB
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại!");
    }

    // Tạo Access Token mới với đủ thông tin
    const newAccessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error("Refresh Token không hợp lệ!");
  }
};

const registerUser = async (email, password, role) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword, role });
  await newUser.save();

  return { user: {
    _id: newUser.id,
    email: newUser.email,
    role: newUser.role,
  } };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Email không tồn tại");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Sai mật khẩu!");
  }
  const {accessToken, refreshToken} = await generateTokens(user);

  return {  user: {
    _id: user.id,
    email: user.email,
    role: user.role,
    fullname: user.fullName,
    avatarUrl: user.avatarUrl,
    resumeUrl: user.resumeUrl,
    company: user.company,
  }, accessToken, refreshToken };

};

const resetPasswordUser = async(email,newPassword)=>{
  const user = await User.findOneAndUpdate(
    { email: email }, 
    { $set: { password: await bcrypt.hash(newPassword, 10) } }, 
    { new: true } 
  );
  return {user: {
    _id: user.id,
    email: user.email,
    role: user.role,
  }};
}

module.exports = { registerUser, loginUser, resetPasswordUser,refreshAccessToken,generateTokens };
