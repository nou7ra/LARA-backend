require("dotenv").config();
const express = require("express");
const passport = require("passport");
require("./config/passport");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging لكل Request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Initialize Passport
app.use(passport.initialize());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB!");
    console.log("MongoDB database name:", mongoose.connection.name);
    mongoose.set("debug", true);
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

  // إعداد مكان حفظ الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');          // لازم تعملي فولدر uploads في الـ root
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// لو عايزة تحددي أنواع الملفات (صور فقط)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image!'), false);
  }
};

const uploadCourseImage = upload.single('image');  // اسم الحقل في الـ form لازم يكون "image"

// Routes
const authRouter = require("./routes/auth");
const studentsRouter = require("./routes/students");
const instructorRouter = require("./routes/instructor");
const adminRouter = require("./routes/admin");

app.use("/auth", authRouter);
app.use("/students", studentsRouter);
app.use("/instructor", instructorRouter);
app.use("/admin", adminRouter);

// Test Route
app.post("/test-save", async (req, res) => {
  const User = require("./models/userSchema");
  const Student = require("./models/studentSchema");
  const Instructor = require("./models/instructorSchema");

  try {
    const testUser = new User({
      name: "Noura Test",
      email: `noura${Date.now()}@example.com`,
      password: "123456",
      role: "student",
    });
    const savedUser = await testUser.save();
    console.log("Saved User:", savedUser);

    const testStudent = new Student({
      userId: savedUser._id,
      full_name: savedUser.name,
      email: savedUser.email,
    });
    const savedStudent = await testStudent.save();
    console.log("Saved Student:", savedStudent);

    const testInstructor = new Instructor({
      name: "Instructor Test",
      email: `instructor${Date.now()}@example.com`,
      password: "123456",
      role: "instructor",
    });
    const savedInstructor = await testInstructor.save();
    console.log("Saved Instructor:", savedInstructor);

    res.json({ savedUser, savedStudent, savedInstructor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const sessionsRouter = require("./routes/session");
app.use("/api/sessions", sessionsRouter);
// Server Listen
app.listen(port, () =>
  console.log(`🚀 Server running on port ${port}`)
);


const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LARA LMS API",
      version: "1.0.0",
      description: "LARA Learning Management System",
      contact: {
        name: "Nourhan Mohamed",
        email: "nouramohamed01097690991@gmail.com"  // حطي اسمك هنا
  }
    },
    servers: [
      {
        url: "https://lara-backend-production.up.railway.app"
      }
    ]
  },
  apis: [path.join(__dirname, "./routes/*.js")]
};

const swaggerSpec = swaggerJsDoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));