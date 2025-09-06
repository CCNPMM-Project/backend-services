const redis = require("redis");

const redisClient = redis.createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

redisClient.connect()
  .then(() => console.log("🔗 Kết nối Redis thành công!"))
  .catch((err) => console.error("❌ Lỗi kết nối Redis:", err));

module.exports = redisClient;
