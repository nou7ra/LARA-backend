const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    full_name: { type: String, default: "No Name Provided" },
    email: { type: String, required: true },
    avatar: { type: String, default: "" },
    interests: { type: [String], default: ["Programming", "Math", "Science"] },
    skills: { type: [String], default: ["Problem Solving", "Communication"] },
    previousCourses: { type: [String], default: [] },
    completedCourses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        score: Number,
        status: String,
      },
    ],

    // ✅ courseProgress جوه الـ schema صح
    courseProgress: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        completedLessons: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema, "students");