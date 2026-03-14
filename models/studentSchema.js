// =======================================================
// Student Schema
// =======================================================
const mongoose = require("mongoose");

// =======================================================
// تعريف سكيمه الطالب
// =======================================================
const studentSchema = new mongoose.Schema(
  {
    // ربط الطالب بالـ User اللي سجل الحساب
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // الاسم الكامل للطالب
    full_name: { type: String, default: "No Name Provided" },

    // الإيميل الخاص بالطالب
    email: { type: String, required: true },

    // اهتمامات الطالب
    interests: { type: [String], default: ["Programming", "Math", "Science"] },

    // المهارات اللي يمتلكها الطالب
    skills: { type: [String], default: ["Problem Solving", "Communication"] },

    // كورسات سابقة قام الطالب بأخذها
    previousCourses: { type: [String], default: [] },

    // كورسات مكتملة مع التقييم والحالة
    completedCourses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        score: Number,
        status: String,
      },
    ],
  },
  {
    // timestamps لإضافة createdAt و updatedAt تلقائيًا
    timestamps: true,
  }
);

courseProgress: [
  {
    courseId:         { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    completedLessons: { type: Number, default: 0 },
    percentage:       { type: Number, default: 0 },
    lastUpdated:      { type: Date, default: Date.now },
  }
],

// =======================================================
// Export الموديل
// =======================================================
module.exports = mongoose.model("Student", studentSchema, "students"); 
// لاحظي: الكوليكشن النهائية هي "students"
