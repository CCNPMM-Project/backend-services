const express = require("express");
const router = express.Router();
const companyController = require("../controller/companyController");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const upload = require("../middlewares/multer.js");

router.post("/", authenticateToken, authorizeRole(["recruit"]),upload.single("avatar"), companyController.createCompany);
router.get("/", authenticateToken, companyController.getAllCompanies);
router.get("/:companyId", authenticateToken, companyController.getCompanyById);
router.put("/:companyId", authenticateToken, authorizeRole(["recruit"]),upload.single("avatar"), companyController.updateCompany);
router.delete("/:companyId", authenticateToken, authorizeRole(["recruit", "admin"]), companyController.deleteCompany);

module.exports = router;
