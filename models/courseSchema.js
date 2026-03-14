const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true
    },

    price: { type: Number, default: 0 },
    duration: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    studentsCount: { type: Number, default: 0 },
    image: { type: String, default: "" },
    hours: { type: Number, default: 0 },
    category: { type: String, default: "General" },
    tags: { type: [String], default: [] },

    // ✅ الطلاب اللي عملوا Enroll في الكورس
    enrolledStudents: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        progress: { type: Number, default: 0 },
        enrolledAt: { type: Date, default: Date.now }
      }
    ],

    materials: {
      type: [
        {
          type: { type: String, enum: ["video", "pdf"], required: true },
          url: { type: String, required: true },
          title: { type: String, required: true }
        }
      ],
      default: []
    },

    // ✅ Sessions
    sessions: {
      type: [
        {
          title: { type: String, required: true },
          date: { type: Date, required: true },
          timeStart: { type: String, required: true },
          timeEnd: { type: String, required: true },
        }
      ],
      default: []
    },

    exam: {
      questions: {
        type: [
          {
            questionText: String,
            options: [String],
            correctAnswer: String
          }
        ],
        default: []
      },
      totalScore: { type: Number, default: 100 }
    },

    // ✅ Reviews من الطلاب
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, default: "" },
        date: { type: Date, default: Date.now }
      }
    ],

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);