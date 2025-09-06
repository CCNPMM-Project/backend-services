const express = require("express");
const cors = require('cors');
const connectDB = require("./src/config/db");
const passport = require("./src/config/passport");
const session = require("express-session");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Nguồn frontend
    credentials: true, // Cho phép gửi cookie/credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Các phương thức được phép
    allowedHeaders: ["Content-Type", "Authorization"], // Các header được phép
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB(); 

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  

app.get("/", (req, res) => {
    res.json({ message: "Hello, world!" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/companies", require("./routes/companyRoutes"));
app.use("/api/users", require("./routes/userRoutes"));


module.exports = app;
