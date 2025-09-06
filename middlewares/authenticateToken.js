const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  // Lấy token từ header (Authorization)
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Nếu không có token
  if (!token) {
    return res.status(401).json({ error: "Không tìm thấy token, vui lòng đăng nhập!" });
  }

  // Kiểm tra và giải mã token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token không hợp lệ!" });
    }
    req.user = decoded;
    next();
  });
};

module.exports = authenticateToken;
