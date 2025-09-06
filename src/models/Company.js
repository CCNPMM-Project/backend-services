const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  location: { type: String, required: true },
  website: { type: String },
  avatarUrl: { type: String, default:"https://cdn-new.topcv.vn/unsafe/https://static.topcv.vn/v4/image/normal-company/logo_default.png" },  // Avatar của công ty
  createdAt: { type: Date, default: Date.now },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // Người quản lý công ty (recruiter)
});

module.exports = mongoose.model("Company", CompanySchema);
