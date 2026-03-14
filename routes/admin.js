const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

// ===== Auth =====
router.post("/login", adminController.loginAdmin);
router.post("/create", adminController.createAdmin);

// ===== Dashboard =====
router.get("/dashboard-stats", authMiddleware, authorizeRoles("admin"), adminController.getDashboardStats);

// ===== Profile =====
router.get("/profile", authMiddleware, authorizeRoles("admin"), adminController.getProfile);
router.put("/profile", authMiddleware, authorizeRoles("admin"), adminController.updateProfile);

// ===== Users =====
router.get("/students", authMiddleware, authorizeRoles("admin"), adminController.getAllStudents);
router.get("/instructors", authMiddleware, authorizeRoles("admin"), adminController.getAllInstructors);
router.get("/user/:id", authMiddleware, authorizeRoles("admin"), adminController.getUserById);
router.get("/instructor/:id", authMiddleware, authorizeRoles("admin"), adminController.getInstructorById);
router.put("/user/:id", authMiddleware, authorizeRoles("admin"), adminController.updateUser);
router.delete("/user/:id", authMiddleware, authorizeRoles("admin"), adminController.deleteUser);
router.delete("/student/:id", authMiddleware, authorizeRoles("admin"), adminController.deleteStudent);
router.delete("/instructor/:id", authMiddleware, authorizeRoles("admin"), adminController.deleteInstructor);


router.get("/charts/dropout-by-level",   authMiddleware, authorizeRoles("admin"), adminController.getDropoutRateByLevel);
router.get("/charts/dropout-comparison", authMiddleware, authorizeRoles("admin"), adminController.getDropoutComparison);
router.get("/charts/repeated-courses",   authMiddleware, authorizeRoles("admin"), adminController.getRepeatedCourses);
router.get("/charts/latest-activity",    authMiddleware, authorizeRoles("admin"), adminController.getLatestActivity);
router.get("/charts/distribution",      authMiddleware, authorizeRoles("admin"), adminController.getDistributionData);
router.get("/charts/pending-approvals", authMiddleware, authorizeRoles("admin"), adminController.getPendingApprovals);


// ===== Courses =====
router.get("/courses", authMiddleware, authorizeRoles("admin"), adminController.getAllCourses);
router.get("/course/:id", authMiddleware, authorizeRoles("admin"), adminController.getCourseById);
router.delete("/course/:courseId", authMiddleware, authorizeRoles("admin"), adminController.deleteCourse);

module.exports = router;