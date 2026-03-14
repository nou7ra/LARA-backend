// models/examSchema.js
const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
  questions: [
    {
      question: { type: String, required: true },
      options: [{ type: String, required: true }], // كل الاختيارات
      correctAnswer: { type: String, required: true } // الإجابة الصحيحة
    }
  ],
  totalMarks: { type: Number, default: 100 },
  date: { type: Date, default: Date.now },
}, {
  timestamps: true
});

module.exports = mongoose.model("Exam", examSchema, "exams");
