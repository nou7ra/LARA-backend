const mongoose = require("mongoose");

const instructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }, // ممكن تشفيره بعدين زي الUsers
    role: { type: String, default: "instructor" },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Instructor", instructorSchema, "instructors");
