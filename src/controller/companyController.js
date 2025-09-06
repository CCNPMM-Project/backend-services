const companyService = require("../services/companyService");

const createCompany = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, location, website } = req.body;
    const avatar = req.file ? req.file.path : null;

    const company = await companyService.createCompany(
      userId,
      name,
      description,
      location,
      website,
      avatar
    );
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const companies = await companyService.getAllCompanies();
    res.status(200).json({ success: true, data: companies });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const company = await companyService.getCompanyById(req.params.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Không tìm thấy công ty!" });
    }
    res.status(200).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const userId = req.user.userId;
    const { name, description, location, website } = req.body;
    const avatar = req.file ? req.file.path : null;

    await companyService.checkCompanyOwnership(companyId, userId);

    const updatedCompany = await companyService.updateCompany(companyId, { name, description, location, website }, avatar);
    if (!updatedCompany) {
      return res.status(404).json({ success: false, message: "Không tìm thấy công ty!" });
    }
    res.status(200).json({ success: true, data: updatedCompany });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const userId = req.user.userId;

    await companyService.checkCompanyOwnership(companyId, userId);
    await companyService.deleteCompany(companyId);
    res.status(200).json({ success: true, message: "Đã xóa công ty!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};