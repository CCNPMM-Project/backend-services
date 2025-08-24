require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const redisClient = require("./src/config/redis");
const { specs, swaggerUi } = require("./src/config/swagger");
const authRoutes = require("./src/routes/authRoute");


const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
connectDB();

redisClient.on("connect", () => console.log("Redis connecting..."));
redisClient.on("ready", () => console.log("✅ Redis connected & ready"));
redisClient.on("error", (err) => console.error("❌ Redis error:", err));

app.use("/api", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
