// controllers/courseController.js
const Course = require("../models/courseSchema");
const User = require("../models/userSchema");

// === CRUD للمدرس ===

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate("instructor", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create({
      title: req.body.title,
      description: req.body.description,
      instructor: req.body.instructor,
      image: req.body.image,
      hours: req.body.hours,
      studentsCount: req.body.studentsCount,
      price: req.body.price,
      rating: req.body.rating,
      category: req.body.category,
      tags: req.body.tags,
      materials: req.body.materials,
      exam: req.body.exam,
      level: req.body.level
    });

    res.status(201).json({
      message: "Course created successfully!",
      course
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourse = await Course.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCourse) return res.status(404).json({ message: "Course not found" });
    res.json(updatedCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === إضافة Exam / أسئلة للكورس ===
exports.addExam = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { questions } = req.body; // [{ questionText, options, correctAnswer }]

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // استبدال الامتحان القديم أو إضافة جديد
    course.exam = {
      questions,
      totalScore: questions.length > 0 ? 100 : 0 // الدرجة الكاملة 100 أو 0 إذا مفيش أسئلة
    };

    await course.save();

    res.status(200).json({ message: "Exam added/updated successfully", exam: course.exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
