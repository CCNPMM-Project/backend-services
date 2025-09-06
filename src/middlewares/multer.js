const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Lưu tệp vào thư mục "uploads"
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Tên tệp sau khi tải lên
  },
  
});

const upload = multer({ storage });

module.exports = upload;
