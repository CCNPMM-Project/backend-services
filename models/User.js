const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  fullName: { 
    default:"",
    type: String
  },
  avatarUrl: { 
    default:"https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg",
    type: String 
  },
  role: { 
    type: String, 
    enum: ["recruit", "candidate", "admin"], 
    required: true 
  },
  resumeUrl: { 
    default:"",
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Company"
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

module.exports = mongoose.model("User", UserSchema);
