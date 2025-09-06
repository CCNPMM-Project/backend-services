const User = require("../models/User");
const fs = require("fs"); // Import thư viện fs
const cloudinary = require("../config/cloudinary");


const getUserProfile = async (userId) => {
  try {
    // Lấy thông tin người dùng từ cơ sở dữ liệu, bỏ qua password
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("Người dùng không tồn tại!");
    }
    return user;
  } catch (error) {
    throw new Error("Đã xảy ra lỗi khi lấy thông tin người dùng!");
  }
};


const updateUserProfile = async (userId, avatar, cv, fullname) => {
  const user = await User.findById(userId);
  if (!user) { throw new Error("Người dùng không tồn tại!");}

  // Upload Avatar lên Cloudinary
  let avatarUrl = user.avatarUrl; // Giữ nguyên nếu không thay đổi
  if (avatar) {
    try {
      const avatarUpload = await cloudinary.uploader.upload(avatar, {
        folder: "avatars",
        allowed_formats: ["jpg", "jpeg", "png", "gif"],
      });
      avatarUrl = avatarUpload.secure_url; // URL ảnh trên Cloudinary

      // Xóa file ảnh sau khi upload thành công
      fs.unlink(avatar, (err) => {
        if (err) console.error("Lỗi xóa file:", err);
      });
    } catch (error) {
      console.error("Lỗi upload Avatar lên Cloudinary:", error);
    }
  }

  // Upload CV lên Cloudinary
  let cvUrl = user.resumeUrl;
  if (cv) {
    try {
    const cvUpload = await cloudinary.uploader.upload(cv, {
      folder: "resume",
      resource_type: "raw", // ✅ QUAN TRỌNG: PDF là 'raw'
      allowed_formats: ["pdf", "doc", "docx"],
      upload_preset:"ml_default",
      type: "upload",            // đảm bảo file là public
      use_filename: true,        // giữ tên gốc
      unique_filename: false,    // không thêm chuỗi ngẫu nhiên
      access_mode: "public",    // <- Đảm bảo file có thể truy cập công khai
    });

      
      cvUrl = cvUpload.secure_url;

      // Xóa file CV sau khi upload thành công
      fs.unlink(cv, (err) => {
        if (err) console.error("Lỗi xóa file:", err);
      });
    } catch (error) {
      console.error("Lỗi upload CV lên Cloudinary:", error);
    }
  }

  // Cập nhật thông tin user
  user.avatarUrl = avatarUrl;
  user.resumeUrl = cvUrl;
  if (fullname) {
    user.fullName = fullname;
  }
  await user.save();
  return user;
};


module.exports = { getUserProfile, updateUserProfile };
