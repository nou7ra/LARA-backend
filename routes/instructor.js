const express = require("express");
const router = express.Router();

const instructorController = require("../controllers/instructorController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

// ================== Auth routes ==================
router.post("/register", instructorController.registerInstructor);
router.post("/login", instructorController.loginInstructor);

// ================== Protected routes ==================
router.use(authMiddleware);

// ✅ هنا قبل authorizeRoles عشان الطالب يقدر يوصله
router.get("/all", instructorController.getAllInstructors);

// كل الروتس دي للـ Instructor فقط
router.use(authorizeRoles("instructor"));

// ------------------ Courses ------------------
router.post("/add-full-course", instructorController.addFullCourse);
router.get("/my-courses", instructorController.getMyCourses);
router.get("/course-exam/:courseId", instructorController.getCourseExam);
router.put("/update-course/:courseId", instructorController.updateCourse);
router.delete(
  "/delete-exam-question/:courseId/:questionId",
  instructorController.deleteExamQuestion
);

router.put("/course/:id", authMiddleware, authorizeRoles("admin", "instructor"), instructorController.updateCourse);
router.delete("/course/:id", authMiddleware, authorizeRoles("admin", "instructor"), instructorController.deleteCourse);


router.get("/recent-activity", instructorController.getRecentActivity);
router.get("/student-feedback", instructorController.getStudentFeedback);


router.get("/my-students", instructorController.getMyStudents);
router.get("/my-sessions", instructorController.getMySessions);
router.post("/add-session", instructorController.addSession);
router.get("/dashboard-stats", instructorController.getDashboardStats);
router.get("/analytics", instructorController.getAnalytics);
router.post("/upload-avatar", instructorController.uploadAvatar);
router.get("/profile", instructorController.getProfile);
router.put("/profile", instructorController.updateProfile);

module.exports = router;