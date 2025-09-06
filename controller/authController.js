const authService = require("../services/authService");
const otpService = require("../services/otpService");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redisClient");
const passport = require("passport");
const { generateTokens } = require("../services/authService");


const googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Callback sau khi Google xác thực
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const { accessToken, refreshToken } = await generateTokens(user);

    // Prepare user data for redirect
    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      company: user.company
    };

    // Redirect to frontend with tokens and user data as query params
    const redirectUrl = `http://localhost:5173/login?accessToken=${encodeURIComponent(
      accessToken
    )}&refreshToken=${encodeURIComponent(
      refreshToken
    )}&user=${encodeURIComponent(JSON.stringify(userData))}`;

    res.redirect(redirectUrl);
  } catch (error) {
    // Redirect with error message if something goes wrong
    const redirectUrl = `http://localhost:5173/login?error=${encodeURIComponent(
      "Đăng nhập bằng Google thất bại: " + error.message
    )}`;
    res.redirect(redirectUrl);
  }
};

// Đăng ký
const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email đã tồn tại!"
      });
    }

    await otpService.storeOtp(email, password, role);

    res.status(200).json({
      success: true,
      message: "OTP đã được gửi đến email của bạn!"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Quên mật khẩu
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email không tồn tại!"
      });
    }

    await otpService.storeOtpResetPassword(email);

    res.status(200).json({
      success: true,
      message: "OTP đã được gửi đến email của bạn!"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
  try {
    const {email,otp, newPassword } = req.body;

    await otpService.verifyOtp(email, otp);

    await authService.resetPasswordUser(email, newPassword);

    res.status(201).json({
      success: true,
      message: "Đổi mật khẩu thành công!"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Hoàn tất đăng ký
const completeRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const { password, role } = await otpService.verifyOtp(email, otp);
    const { user } = await authService.registerUser(email, password, role);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: { 
        user,
        accessToken, 
        refreshToken 
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Đăng xuất
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies["refresh_token"];
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const { sessionId, userId } = decoded;

      const key = `refreshTokens:${userId}`;
      const userTokens = await redisClient.sMembers(key);
      const tokenToRemove = userTokens.find((token) => {
        const tokenDecoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        return tokenDecoded.sessionId === sessionId;
      });

      if (tokenToRemove) {
        await redisClient.sRem(key, tokenToRemove);
      }

      res.clearCookie("refresh_token");
    }

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Đã có lỗi xảy ra khi đăng xuất!"
    });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Thiếu Refresh Token!"
      });
    }

    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  completeRegistration,
  forgetPassword,
  resetPassword,
  refreshToken,
  googleLogin,
  googleCallback,
};
