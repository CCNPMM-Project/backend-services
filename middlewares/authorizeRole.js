const authorizeRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: "Vui lòng đăng nhập để tiếp tục!" });
      }
  
      const userRole = req.user.role;
  
      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: "Bạn không có quyền truy cập!" });
      }
  
      next();
    };
  };
  
  module.exports = authorizeRole;