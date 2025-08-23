require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const redisClient = require("./config/redis");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
connectDB();

redisClient.on("connect", () => {
  console.log("Redis connecting...");
});
redisClient.on("ready", () => {
  console.log("✅ Redis connected & ready");
});
redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err);
});


const authRoutes = require("./routes/authRoute");
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
