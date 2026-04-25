const axios = require("axios");

const LARA_BASE_URL = "http://localhost:8000"; // غيّر لو السيرفر على IP تاني

// ✅ تأكد إن السيرفر شغال
async function checkHealth() {
  const res = await axios.get(`${LARA_BASE_URL}/health`);
  return res.data;
}

// ✅ اقتراح كورسات بناءً على بيانات الطالب
async function getRecommendations(studentData) {
  const res = await axios.post(`${LARA_BASE_URL}/recommend`, {
    interests: studentData.interests,           // مصفوفة: ["Python", "AI"]
    previous_courses: studentData.previousCourses, // مصفوفة: ["Intro to Python"]
    skills: studentData.skills,                 // مصفوفة: ["programming"]
    current_level: studentData.level,           // "Beginner" | "Intermediate" | "Advanced"
    exam_score: studentData.examScore,          // رقم من 0 لـ 100
    full_name: studentData.fullName,            // string
    top_k: studentData.topK || 5,              // عدد الكورسات المقترحة
  });
  return res.data;
}

// ✅ اقتراح كورسات باسم طالب موجود في الداتاسيت
async function getRecommendationsByName(studentName, topK = 5) {
  const res = await axios.post(`${LARA_BASE_URL}/recommend/by-student`, {
    student_name: studentName,
    top_k: topK,
  });
  return res.data;
}

// ✅ جيب كورس by id
async function getCourseById(courseId) {
  const res = await axios.get(`${LARA_BASE_URL}/course/${courseId}`);
  return res.data;
}

// ✅ حساب match لكورس واحد مباشرة من الـ AI
async function getMatchScore(studentData, course) {
  const res = await axios.post(`${LARA_BASE_URL}/match-score`, {
    interests: studentData.interests,
    skills: studentData.skills,
    course_title: course.title,
    course_category: course.subcategory || course.category ||  "",
  });
  return res.data.match_percentage;
}

// ✅ حساب match لكل الكورسات المسجل فيها
async function getEnrolledCoursesMatch(studentData, enrolledCourses) {
  const results = await Promise.all(
    enrolledCourses.map(async (course) => {
      try {
        const match_percentage = await getMatchScore(studentData, course);
        return {
          courseId: course._id,
          title: course.title,
          match_percentage,
        };
      } catch {
        return {
          courseId: course._id,
          title: course.title,
          match_percentage: 60,
        };
      }
    })
  );
  return results;
}

module.exports = {
  checkHealth,
  getRecommendations,
  getRecommendationsByName,
  getCourseById,
  getMatchScore,
  getEnrolledCoursesMatch,
};