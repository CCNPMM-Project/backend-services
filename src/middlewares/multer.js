const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Đảm bảo thư mục uploads tồn tại
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sử dụng đường dẫn tuyệt đối để đảm bảo đúng vị trí
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Tên tệp sau khi tải lên
  },
});

const upload = multer({ storage });

module.exports = upload;
