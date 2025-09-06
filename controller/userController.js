const { updateUserProfile, getUserProfile } = require("../services/userService");
const path = require("path");
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user; // Lấy userId từ JWT token (giả sử đã có middleware xác thực)
    const { fullname } = req.body; // Các thông tin khác gửi qua body
    const avatarPath = req.files.avatar ? path.resolve(req.files.avatar[0].path) : null;
    const cvPath = req.files.cv ? path.resolve(req.files.cv[0].path) : null;
    const updatedUser = await updateUserProfile(userId, avatarPath, cvPath, fullname);

    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công!",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Đã xảy ra lỗi khi cập nhật hồ sơ!" });
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
