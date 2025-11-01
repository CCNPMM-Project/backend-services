const { updateUserProfile, getUserProfile } = require("../services/userService");
const path = require("path");
const fs = require("fs");

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user; // Lấy userId từ JWT token (giả sử đã có middleware xác thực)
    const { fullname } = req.body; // Các thông tin khác gửi qua body
    
    // Lấy đường dẫn file từ multer (đã là đường dẫn tuyệt đối)
    let avatarPath = null;
    let cvPath = null;
    
    if (req.files?.avatar && req.files.avatar[0]) {
      avatarPath = path.resolve(req.files.avatar[0].path);
      // Kiểm tra file có tồn tại không
      if (!fs.existsSync(avatarPath)) {
        throw new Error(`File avatar không tồn tại: ${avatarPath}`);
      }
    }
    
    if (req.files?.cv && req.files.cv[0]) {
      cvPath = path.resolve(req.files.cv[0].path);
      // Kiểm tra file có tồn tại không
      if (!fs.existsSync(cvPath)) {
        throw new Error(`File CV không tồn tại: ${cvPath}`);
      }
    }
    
    const updatedUser = await updateUserProfile(userId, avatarPath, cvPath, fullname);

    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ:", error);
    return res.status(500).json({ 
      error: error.message || "Đã xảy ra lỗi khi cập nhật hồ sơ!" 
    });
  }
};

const getProfile = async (req, res) => {
    try {
      const { userId } = req.user; // Lấy userId từ JWT
  
      const user = await getUserProfile(userId); // Gọi service để lấy thông tin người dùng
  
      return res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  };

module.exports = { updateProfile, getProfile };
