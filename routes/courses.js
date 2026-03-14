const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

// ==========================================
// حماية كل الروتس بالـ Token
// ==========================================
router.use(authMiddleware);

// ==========================================
// CRUD للمدرس / Admin
// ==========================================

// GET: كل الكورسات
router.get("/", courseController.getAllCourses);

// GET: كورس معين بالـ ID
router.get("/:id", courseController.getCourseById);

// POST: إضافة كورس جديد → role = instructor أو admin
router.post(
  "/",
  authorizeRoles("instructor", "admin"),
  courseController.createCourse
);

// PUT: تعديل كورس → role = instructor أو admin
router.put(
  "/:id",
  authorizeRoles("instructor", "admin"),
  courseController.updateCourse
);

// DELETE: حذف كورس → role = instructor أو admin
router.delete(
  "/:id",
  authorizeRoles("instructor", "admin"),
  courseController.deleteCourse
);

// ==========================================
// إضافة / تحديث Exam للكورس → role = instructor أو admin
// ==========================================
router.post(
  "/:courseId/add-exam",
  authorizeRoles("instructor", "admin"),
  courseController.addExam
);

// ==========================================
// Export Router
// ==========================================
module.exports = router;
