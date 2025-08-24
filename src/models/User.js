const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    fullName: { type: String, default: "" },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    phoneNumber: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("User", userSchema);
