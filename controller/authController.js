const User = require("../models/User");
const generateOtp = require("../utils/generateOtp");
const sendMail = require("../helpers/sendMail");
const bcrypt = require("bcryptjs");
const redisClient = require("../config/redis");

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email đã tồn tại" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();

        const otp = generateOtp();
        await redisClient.setEx(`otp:${email}`, 300, otp);

        await sendMail(email, "Mã OTP xác thực", `Mã OTP của bạn là: ${otp}`);

        res.json({ message: "Đăng ký thành công, vui lòng kiểm tra email để nhập OTP" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

        const storedOtp = await redisClient.get(`otp:${email}`);
        if (!storedOtp) return res.status(400).json({ message: "OTP hết hạn hoặc không tồn tại" });

        if (storedOtp !== otp) return res.status(400).json({ message: "OTP không hợp lệ" });

        user.isVerified = true;
        await user.save();

        await redisClient.del(`otp:${email}`);

        res.json({ message: "Xác thực thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
