const mongoose = require("mongoose");
const User = require("../models/userSchema");
const Student = require("../models/studentSchema");
const Course = require("../models/courseSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/avatars";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar_student_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

exports.uploadMiddleware = multer({ storage: avatarStorage }).single("avatar");

exports.registerStudent = async (req, res) => {
  try {
    const role = req.body.role || "student";
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });
    const user = new User({ name, email, password, role });
    const savedUser = await user.save();
    let studentProfile = null;
    if (role === "student") {
      studentProfile = new Student({ userId: savedUser._id, full_name: name, email, interests: [], skills: [] });
      await studentProfile.save();
    }
    const { password: removed, ...safeUser } = savedUser.toObject();
    res.status(201).json({ message: `${role} registered`, user: safeUser, studentProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ userId });
    if (!student) return res.status(404).json({ message: "Student not found" });
    const skills = Array.isArray(student.skills) ? student.skills.filter(s => s) : [];
    const interests = Array.isArray(student.interests) ? student.interests.filter(i => i) : [];
    const previous = Array.isArray(student.previousCourses) ? student.previousCourses.filter(p => p) : [];
    const allKeywords = [...skills, ...interests, ...previous];
    let recommendedCourses = [];
    if (allKeywords.length > 0) {
      recommendedCourses = await Course.find({
        $or: [
          { category: { $in: allKeywords } },
          { tags: { $in: allKeywords } },
          { title: { $regex: allKeywords.join("|"), $options: "i" } }
        ]
      }).limit(5);
    }
    if (recommendedCourses.length > 0) {
      return res.json({ message: "Personalized recommendations found", source: "Based on your Skills, Interests, and History", recommendations: recommendedCourses });
    } else {
      return res.json({
        message: "No exact match in database, but here is a suggestion:",
        recommendation: {
          title: skills.length > 0 ? `Advance your skills in: ${skills[0]}` : "Explore New Opportunities",
          description: "AI generated recommendation based on your profile history",
          based_on: { skills, interests, previous }
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourseExam = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Exam fetched successfully", exam: course.exam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, interests, skills, previousCourses } = req.body;
    await User.findByIdAndUpdate(userId, { name, email });
    const updateData = { full_name: name, email, interests, skills, previousCourses };
    if (req.file) {
      updateData.avatar = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
    }
    const student = await Student.findOneAndUpdate({ userId }, updateData, { new: true });
    res.json({ message: "Updated", student, avatar: student.avatar || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name");
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitExam = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentAnswers } = req.body;
    const userId = req.user.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    let score = 0;
    const questions = course.exam.questions;
    if (studentAnswers && Array.isArray(studentAnswers)) {
      studentAnswers.forEach((answer, index) => {
        if (questions[index] && answer) {
          if (answer.toString().toLowerCase().trim() === questions[index].correctAnswer.toString().toLowerCase().trim()) score++;
        }
      });
    }
    const totalQuestions = questions.length;
    const finalGrade = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const isPassed = finalGrade >= 50;
    const newLevel = finalGrade >= 80 ? "Advanced"
      : finalGrade >= 60 ? "Intermediate"
      : "Beginner";
    await Student.findOneAndUpdate(
      { userId },
      {
        $push: {
          completedCourses: {
            course: courseId,
            score,
            status: isPassed ? "passed" : "failed"
          }
        },
        $set: { level: newLevel }
      }
    );
    if (isPassed) {
      await Student.findOneAndUpdate(
        { userId },
        { $push: { previousCourses: course.title } }
      );
    }
    res.status(200).json({ message: "Exam submitted successfully", score, totalQuestions, grade: `${finalGrade}%`, passed: isPassed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    await Student.findOneAndDelete({ userId: id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ userId }).populate("completedCourses.course", "title category level");
    if (!student) return res.status(404).json({ message: "Student profile not found" });
    res.status(200).json({
      message: "Profile retrieved successfully",
      data: {
        fullName: student.full_name,
        email: student.email,
        avatar: student.avatar || "",
        interests: student.interests,
        skills: student.skills,
        history: student.previousCourses,
        level: student.level || "Beginner",
        achievements: student.completedCourses
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ userId });
    res.json({ courseProgress: student?.courseProgress || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    const alreadyEnrolled = course.enrolledStudents?.some(
      e => e.student?.toString() === userId || e.toString() === userId
    );
    if (alreadyEnrolled) return res.json({ message: "Already enrolled" });
    course.enrolledStudents.push({ student: userId, progress: 0 });
    await course.save();
    res.json({ message: "Enrolled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ التعديل الأول - saveProgress
exports.saveProgress = async (req, res) => {
  try {
    const { courseId, progress } = req.body;
    const userId = req.user.id;

    // 1. حفظ في course.enrolledStudents
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrollment = course.enrolledStudents.find(
      e => e.student?.toString() === userId
    );
    if (enrollment) {
      // ✅ حفظ الأعلى بس مش تنزل
      if (progress > enrollment.progress) {
        enrollment.progress = progress;
      }
    } else {
      course.enrolledStudents.push({ student: userId, progress });
    }
    await course.save();

    // 2. حفظ في student.courseProgress كمان
    const student = await Student.findOne({ userId });
    if (student) {
      const existingProgress = student.courseProgress.find(
        p => p.courseId?.toString() === courseId
      );
      if (existingProgress) {
        // ✅ حفظ الأعلى بس مش تنزل
        if (progress > existingProgress.percentage) {
          existingProgress.percentage = progress;
          existingProgress.lastUpdated = new Date();
        }
      } else {
        student.courseProgress.push({
          courseId,
          percentage: progress,
          lastUpdated: new Date(),
        });
      }
      await student.save();
    }

    res.json({ message: "Progress saved", progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const courses = await Course.find({});
    const allSessions = [];
    courses.forEach(course => {
      (course.sessions || []).forEach(session => {
        allSessions.push({ _id: session._id, title: session.title, courseTitle: course.title, date: session.date, timeStart: session.timeStart, timeEnd: session.timeEnd, price: session.price || 0, meetingLink: session.meetingLink || "" });
      });
    });
    allSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json({ sessions: allSessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const userId = req.user.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    const existing = course.reviews?.find(r => r.userId?.toString() === userId);
    if (existing) return res.status(400).json({ error: "You already reviewed this course" });
    course.reviews.push({ userId, rating, comment, date: new Date() });
    await course.save();
    res.json({ message: "Review submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ التعديل الثاني - getMyProgress
exports.getMyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ userId });
    const courses = await Course.find({ "enrolledStudents.student": userId });

    const progressData = courses.map(course => {
      const enrollment = course.enrolledStudents.find(
        e => e.student?.toString() === userId
      );

      // ✅ جيب من الاتنين وخد الأعلى
      const courseProgressEntry = student?.courseProgress?.find(
        p => p.courseId?.toString() === course._id.toString()
      );

      const progressFromCourse = enrollment?.progress || 0;
      const progressFromStudent = courseProgressEntry?.percentage || 0;
      const finalProgress = Math.max(progressFromCourse, progressFromStudent);

      const quizResult = student?.completedCourses?.find(
        cc => cc.course?.toString() === course._id.toString()
      );

      return {
        courseId: course._id,
        progress: finalProgress,
        quizScore: quizResult ? quizResult.score : null,
        quizStatus: quizResult ? quizResult.status : null,
      };
    });

    res.json({ progressData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyStudents = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id }).lean();
    const courseMap = {};
    courses.forEach(c => { courseMap[c._id.toString()] = c.title; });
    const courseIds = courses.map(c => c._id);
    const allStudents = new Map();
    courses.forEach(course => {
      (course.enrolledStudents || []).forEach(e => {
        const studentId = e.student ? e.student.toString() : e.toString();
        const progress = e.progress || 0;
        if (!allStudents.has(studentId)) {
          allStudents.set(studentId, { progress, courseName: courseMap[course._id.toString()] });
        }
      });
    });
    const oldStudents = await Student.find({ "completedCourses.course": { $in: courseIds } });
    oldStudents.forEach(s => {
      const userId = s.userId?.toString();
      if (userId && !allStudents.has(userId)) {
        const related = s.completedCourses.filter(cc => courseIds.some(id => id.toString() === cc.course?.toString()));
        const last = related[related.length - 1];
        allStudents.set(userId, {
          progress: last?.status === "passed" ? 100 : (last?.score || 0),
          courseName: last ? courseMap[last.course?.toString()] || "—" : "—"
        });
      }
    });
    if (allStudents.size === 0) return res.json({ students: [] });
    const users = await User.find({ _id: { $in: [...allStudents.keys()] }, role: "student" });
    const result = users.map(u => {
      const data = allStudents.get(u._id.toString()) || {};
      return {
        _id: u._id,
        name: u.name || "Unknown",
        email: u.email || "—",
        courseName: data.courseName || "—",
        progress: data.progress || 0,
        lastActivity: "—",
      };
    });
    res.json({ students: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};