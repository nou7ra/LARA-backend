const express = require("express");
const router = express.Router();
const {
  getRecommendations,
  getRecommendationsByName,
  checkHealth,
  getCourseById,
  getEnrolledCoursesMatch,
} = require("../services/laraService");

// ✅ health check
router.get("/health", async (req, res) => {
  try {
    const result = await checkHealth();
    res.json(result);
  } catch (error) {
    res.status(503).json({ error: "AI مش شغال" });
  }
});

// ✅ توصية بناءً على بيانات الطالب
router.post("/recommend", async (req, res) => {
  try {
    const result = await getRecommendations(req.body);
    res.json(result);
  } catch (error) {
    console.error("LARA Error:", error.message);
    res.status(500).json({ error: "فشل في جلب الاقتراحات" });
  }
});

// ✅ course by id
router.get("/course/:courseId", async (req, res) => {
  try {
    const result = await getCourseById(req.params.courseId);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: "Course not found" });
  }
});

// ✅ توصية باسم طالب
router.post("/recommend/by-student", async (req, res) => {
  try {
    const result = await getRecommendationsByName(
      req.body.student_name,
      req.body.top_k || 5
    );
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: "الطالب مش موجود في الداتاسيت" });
  }
});

// ✅ match للكورسات المسجل فيها
router.post("/enrolled-match", async (req, res) => {
  try {
    const { studentData, enrolledCourses } = req.body;
    const result = await getEnrolledCoursesMatch(studentData, enrolledCourses);
    res.json({ matches: result });
  } catch (error) {
    console.error("Enrolled Match Error:", error.message);
    res.status(500).json({ error: "فشل في حساب الـ match" });
  }
});

module.exports = router;