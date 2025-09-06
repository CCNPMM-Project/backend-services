require("dotenv").config(); // Nạp biến môi trường từ .env
const app = require("./app"); // Import app.js

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
