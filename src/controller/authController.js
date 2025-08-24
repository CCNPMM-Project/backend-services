const User = require("../models/User");
const generateOtp = require("../utils/generateOtp");
const sendMail = require("../helpers/sendMail");
const bcrypt = require("bcryptjs");
const redisClient = require("../config/redis");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();

        const otp = generateOtp();
        await redisClient.setEx(`otp:${email}`, 300, otp);

        await sendMail(email, "Verification OTP Code", `Your OTP code is: ${otp}`);

        res.json({ message: "Registration successful, please check your email for OTP" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const storedOtp = await redisClient.get(`otp:${email}`);
        if (!storedOtp) return res.status(400).json({ message: "OTP expired or does not exist" });

        if (storedOtp !== otp) return res.status(400).json({ message: "Invalid OTP" });

        user.isVerified = true;
        await user.save();

        await redisClient.del(`otp:${email}`);

        res.json({ message: "Verification successful" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: "Account not verified, please check your email" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    isVerified: user.isVerified
                }
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            message: "Profile retrieved successfully",
            data: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ status: 200, message: "Token is valid" });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        const { fullName, dateOfBirth, gender, phoneNumber, profilePicture } = req.body;
        user.fullName = fullName || user.fullName;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        user.gender = gender || user.gender;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.profilePicture = profilePicture || user.profilePicture;

        await user.save();
        res.json({
            message: "Profile updated successfully",
            data: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};