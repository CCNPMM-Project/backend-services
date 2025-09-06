const express = require("express");
const { updateProfile, getProfile } = require("../controller/userController.js");
const upload = require("../middlewares/multer.js");
const authenticateToken = require("../middlewares/authenticateToken.js")
const router = express.Router();

router.put("/profile", authenticateToken, upload.fields([{ name: "avatar" }, { name: "cv" }]), updateProfile);
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
