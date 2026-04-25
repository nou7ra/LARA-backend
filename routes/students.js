const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student routes
 */

/**
 * @swagger
 * /students/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student registered successfully
 */
router.post("/register", (req, res, next) => {
  req.body.role = "student";
  next();
}, studentController.registerStudent);

/**
 * @swagger
 * /students/login:
 *   post:
 *     summary: Student login
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful with token
 */
router.post("/login", studentController.loginStudent);

/**
 * @swagger
 * /students/update-profile:
 *   put:
 *     summary: Update student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put("/update-profile", authMiddleware, studentController.uploadMiddleware, studentController.updateProfile);

/**
 * @swagger
 * /students/recommendation:
 *   get:
 *     summary: Get personalized course recommendations
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations returned
 */
router.get("/recommendation", authMiddleware, studentController.getRecommendation);

/**
 * @swagger
 * /students/courses:
 *   get:
 *     summary: Get all available courses
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get("/courses", authMiddleware, studentController.getAllCourses);

/**
 * @swagger
 * /students/my-profile:
 *   get:
 *     summary: Get student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile data
 */
router.get("/my-profile", authMiddleware, studentController.getStudentProfile);

/**
 * @swagger
 * /students/course-exam/{courseId}:
 *   get:
 *     summary: Get exam for a specific course
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam data
 */
router.get("/course-exam/:courseId", authMiddleware, studentController.getCourseExam);

/**
 * @swagger
 * /students/submit-exam/{courseId}:
 *   post:
 *     summary: Submit exam answers
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentAnswers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Exam submitted with score
 */
router.post("/submit-exam/:courseId", authMiddleware, studentController.submitExam);

/**
 * @swagger
 * /students/sessions:
 *   get:
 *     summary: Get all available sessions
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get("/sessions", authMiddleware, studentController.getAllSessions);

/**
 * @swagger
 * /students/save-progress:
 *   post:
 *     summary: Save course progress
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *               progress:
 *                 type: number
 *     responses:
 *       200:
 *         description: Progress saved
 */
router.post("/save-progress", authMiddleware, studentController.saveProgress);

/**
 * @swagger
 * /students/review:
 *   post:
 *     summary: Submit a course review
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review submitted
 */
router.post("/review", authMiddleware, authorizeRoles("student"), studentController.submitReview);

/**
 * @swagger
 * /students/progress:
 *   get:
 *     summary: Get student progress
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress data
 *   post:
 *     summary: Save student progress
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress saved
 */
router.post("/progress", authMiddleware, studentController.saveProgress);
router.get("/progress", authMiddleware, studentController.getProgress);

/**
 * @swagger
 * /students/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enrolled successfully
 */
router.post("/enroll", authMiddleware, authorizeRoles("student"), studentController.enrollCourse);
router.get("/my-progress", authMiddleware, studentController.getMyProgress);
/**
 * @swagger
 * /students/all:
 *   get:
 *     summary: Get all students (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all students
 */
router.get("/all", authMiddleware, authorizeRoles("admin"), studentController.getAllStudents);

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete a student (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted
 */
router.delete("/:id", authMiddleware, authorizeRoles("admin"), studentController.deleteStudent);

module.exports = router;