const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const passport = require("../config/passport");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/complete-registration", authController.completeRegistration);
router.post("/forgot-password", authController.forgetPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);
router.get("/google", authController.googleLogin);
router.get("/google/callback", passport.authenticate("google", { session: false }), authController.googleCallback);

module.exports = router;