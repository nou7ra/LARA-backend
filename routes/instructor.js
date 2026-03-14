const express = require("express");
const router = express.Router();

const instructorController = require("../controllers/instructorController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

// ================== Auth routes ==================
// تسجيل Instructor جديد
router.post("/register", instructorController.registerInstructor);

// تسجيل الدخول
router.post("/login", instructorController.loginInstructor);

// ================== Protected routes ==================
// أي روتر بعد كده محتاج توكن
router.use(authMiddleware);

// كل الروتس دي للـ Instructor فقط
router.use(authorizeRoles("instructor"));

// ------------------ Courses ------------------
// إضافة كورس كامل
router.post("/add-full-course", instructorController.addFullCourse);


// مشاهدة كل الكورسات الخاصة بالـ Instructor
router.get("/my-courses", instructorController.getMyCourses);

// مشاهدة امتحان كورس معين
router.get("/course-exam/:courseId", instructorController.getCourseExam);

// تحديث كورس
router.put("/update-course/:courseId", instructorController.updateCourse);

// حذف سؤال من امتحان كورس
router.delete(
  "/delete-exam-question/:courseId/:questionId",
  instructorController.deleteExamQuestion
);


// التعديل الصح في ملف routes/instructor.js
router.put("/course/:id", authMiddleware, authorizeRoles("admin", "instructor"), instructorController.updateCourse);
router.delete("/course/:id", authMiddleware, authorizeRoles("admin", "instructor"), instructorController.deleteCourse);

router.get("/my-students", instructorController.getMyStudents);

router.get("/my-sessions", instructorController.getMySessions);
router.post("/add-session", instructorController.addSession);
router.get("/dashboard-stats", instructorController.getDashboardStats);
router.get("/analytics", instructorController.getAnalytics); 
router.get("/profile", instructorController.getProfile);
router.put("/profile", instructorController.updateProfile);
module.exports = router;
