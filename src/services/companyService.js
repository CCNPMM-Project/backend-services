const Company = require("../models/Company");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const checkCompanyOwnership = async (companyId, userId) => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error("Công ty không tồn tại!");
  }
  if (company.recruiter.toString() !== userId) {
    throw new Error("Bạn không có quyền truy cập công ty này!");
  }
  return company;
};

const createCompany = async (userId, name, description, location, website, avatar) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Không tìm thấy người dùng!");
  }
  if (user.company) {
    throw new Error("Bạn đã có công ty rồi!");
  }

  let avatarUrl = "";
  if (avatar) {
    try {
      const avatarUpload = await cloudinary.uploader.upload(avatar, {
        folder: "company_avatars",
        allowed_formats: ["jpg", "jpeg", "png", "gif"],
      });
      avatarUrl = avatarUpload.secure_url;

      // Xóa file tạm sau khi upload
      fs.unlink(avatar, (err) => {
        if (err) console.error("Lỗi xóa file:", err);
      });
    } catch (error) {
      console.error("Lỗi upload avatar lên Cloudinary:", error);
      throw new Error("Lỗi upload avatar!");
    }
  }

  const company = await Company.create({
    name,
    description,
    location,
    website,
    avatarUrl,
    recruiter: user._id,
  });

  user.company = company._id;
  await user.save();

  return company;
};

const getAllCompanies = async () => {
  return await Company.find();
};

const getCompanyById = async (id) => {
  return await Company.findById(id);
};

const updateCompany = async (id, updateData, avatar) => {
  const company = await Company.findById(id);
  if (!company) {
    throw new Error("Công ty không tồn tại!");
  }

  let avatarUrl = company.avatarUrl;
  if (avatar) {
    try {
      const avatarUpload = await cloudinary.uploader.upload(avatar, {
        folder: "company_avatars",
        allowed_formats: ["jpg", "jpeg", "png", "gif"],
      });
      avatarUrl = avatarUpload.secure_url;

      fs.unlink(avatar, (err) => {
        if (err) console.error("Lỗi xóa file:", err);
      });
    } catch (error) {
      console.error("Lỗi upload avatar lên Cloudinary:", error);
      throw new Error("Lỗi upload avatar!");
    }
  }

  return await Company.findByIdAndUpdate(
    id,
    { ...updateData, avatarUrl },
    { new: true }
  );
};

const deleteCompany = async (id) => {
  const company = await Company.findById(id);
  if (!company) {
    throw new Error("Công ty không tồn tại!");
  }

  // Xóa công ty khỏi user
  await User.updateOne({ company: id }, { $unset: { company: "" } });
  await Company.findByIdAndDelete(id);
};

module.exports = {
  checkCompanyOwnership,
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};