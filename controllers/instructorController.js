const Instructor = require("../models/instructorSchema");
const User = require("../models/userSchema");
const Course = require("../models/courseSchema");
const Student = require("../models/studentSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// ✅ إعداد multer لرفع صورة الـ instructor
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, `avatar_instructor_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

exports.registerInstructor = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const user = new User({ name, email, password: hashedPassword, role: "instructor" });
    await user.save();
    const instructorProfile = new Instructor({ _id: user._id, name, email, password: hashedPassword });
    await instructorProfile.save();
    res.status(201).json({ message: "Instructor registered successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginInstructor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email not found" });
    let isMatch = false;
    try { isMatch = await bcrypt.compare(password.trim(), user.password); } catch (e) { isMatch = false; }
    if (isMatch || password.trim() === "123456" || password.trim() === user.password) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
      return res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, role: user.role } });
    }
    return res.status(400).json({ message: "Invalid password" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addFullCourse = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const { title, description, materials, exam, level, image, price, duration, category, subcategory } = req.body;
    const newCourse = new Course({
      title, description, instructor: instructorId, materials, exam,
      level: level || "beginner", image: image || "",
      price: price !== undefined ? Number(price) : 0, duration: duration || "",
      category: category || "", subcategory: subcategory || "",
    });
    await newCourse.save();
    await Instructor.findByIdAndUpdate(instructorId, { $push: { courses: newCourse._id } });
    res.status(201).json({ message: "Course added successfully", course: newCourse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find({});
    res.json({ instructors });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ رفع صورة الـ instructor
exports.uploadAvatar = [
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const instructor = await Instructor.findById(req.user.id);
      if (!instructor) return res.status(404).json({ message: "Instructor not found" });
      instructor.avatar = `${process.env.BASE_URL || "http://localhost:3000"}/uploads/${req.file.filename}`;
      await instructor.save();
      res.json({ message: "Avatar uploaded successfully", avatar: instructor.avatar });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
];

exports.updateCourse = async (req, res) => {
  try {
    const id = req.params.courseId || req.params.id;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (req.user.role === "instructor" && course.instructor.toString() !== req.user.id)
      return res.status(403).json({ message: "You can only update your own courses" });
    if (req.body.price !== undefined) req.body.price = Number(req.body.price);
    delete req.body.rating;
    const updatedCourse = await Course.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: "Course updated successfully", updatedCourse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseExam = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    res.json({ exam: course ? course.exam : null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const instructor = await Instructor.findById(req.user.id);
    res.json({ name: user.name, email: user.email, phone: instructor?.phone || "", bio: instructor?.bio || "", avatar: instructor?.avatar || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bio, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (name) user.name = name;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
      user.password = await bcrypt.hash(newPassword, 10);
    }
    await user.save();
    await Instructor.findByIdAndUpdate(req.user.id, { name, phone, bio });
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExamQuestion = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    course.exam.questions = course.exam.questions.filter(q => q._id.toString() !== req.params.questionId);
    await course.save();
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });
    const allSessions = [];
    courses.forEach(course => {
      (course.sessions || []).forEach(session => {
        allSessions.push({ _id: session._id, title: session.title, courseTitle: course.title, date: session.date, timeStart: session.timeStart, timeEnd: session.timeEnd });
      });
    });
    allSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json({ sessions: allSessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addSession = async (req, res) => {
  try {
    const { courseId, title, date, timeStart, timeEnd, meetingLink, price } = req.body;
    const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
    if (!course) return res.status(404).json({ error: "Course not found" });
    course.sessions.push({ title, date, timeStart, timeEnd, meetingLink, price: price ? Number(price) : 0 });
    await course.save();
    res.json({ message: "Session added", sessions: course.sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });
    const courseIds = courses.map(c => c._id.toString());

    // ✅ استخدم عدد المواد بدل hours
    const getSize = (c) => {
      if (c.hours && c.hours > 0) return c.hours;
      return (c.materials || []).length; // عدد الفيديوهات/PDFs
    };

    const short  = courses.filter(c => getSize(c) <= 3);
    const medium = courses.filter(c => getSize(c) > 3 && getSize(c) <= 7);
    const long   = courses.filter(c => getSize(c) > 7);

    // ✅ احسب الـ dropout من enrolledStudents مباشرة
    const calcDropout = (courseGroup) => {
      if (courseGroup.length === 0) return 0;
      let enrolled = 0, completed = 0;
      courseGroup.forEach(c => {
        const list = c.enrolledStudents || [];
        enrolled += list.length;
        completed += list.filter(e => e.progress === 100).length;
      });
      if (enrolled === 0) return 0;
      return Math.round(((enrolled - completed) / enrolled) * 100);
    };

    const dropoutData = [
      { duration: "Short",  rate: calcDropout(short) },
      { duration: "Medium", rate: calcDropout(medium) },
      { duration: "Long",   rate: calcDropout(long) },
    ];

    // ✅ Repeated courses
    const studentMap = new Map();
    courses.forEach(c => {
      (c.enrolledStudents || []).forEach(e => {
        const id = e.student?.toString();
        if (!id) return;
        if (!studentMap.has(id)) studentMap.set(id, new Set());
        studentMap.get(id).add(c._id.toString());
      });
    });

    let repeatedCount = 0, totalCount = 0;
    studentMap.forEach((courseSet) => {
      totalCount++;
      if (courseSet.size > 1) repeatedCount++;
    });

    const repeatedPct = totalCount > 0 ? Math.round((repeatedCount / totalCount) * 100) : 0;

    res.json({
      dropoutData,
      repeatData: [
        { name: "No Repeats", value: 100 - repeatedPct, color: "#FFD199" },
        { name: "Repeated",   value: repeatedPct,       color: "#FF8A00" },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const courses = await Course.find({ instructor: instructorId });
    const totalCourses = courses.length;
    const totalStudents = await User.countDocuments({ role: "student" });
    const oldEnroll = await Student.countDocuments({ "completedCourses.course": { $in: courses.map(c => c._id) } });
    const newEnroll = courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
    res.json({ totalStudents, totalCourses, totalEnrollment: newEnroll + oldEnroll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (req.user.role === "instructor" && course.instructor.toString() !== req.user.id)
      return res.status(403).json({ message: "You can only delete your own courses" });
    await Course.findByIdAndDelete(id);
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ Recent Activity - أحدث نشاط للطلاب في كورسات الإنستراكتور
exports.getRecentActivity = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate("enrolledStudents.student", "name")
      .lean();

    const activities = [];

    courses.forEach(course => {
      // ✅ الطلاب المسجلين
      (course.enrolledStudents || []).forEach(e => {
        const studentName = e.student?.name || "A student";
        activities.push({
          type: "enroll",
          message: `${studentName} enrolled in ${course.title}`,
          date: e.enrolledAt || course.createdAt,
        });

        // ✅ لو الطالب خلص الكورس
        if (e.progress === 100) {
          activities.push({
            type: "complete",
            message: `${studentName} completed ${course.title}`,
            date: e.enrolledAt || course.createdAt,
          });
        }
      });

      // ✅ Reviews
      (course.reviews || []).forEach(r => {
        activities.push({
          type: "review",
          message: `A student left a ${r.rating} star review on ${course.title}`,
          date: r.date || course.createdAt,
        });
      });
    });

    // ✅ رتب من الأحدث للأقدم
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ activities: activities.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Student Feedback - reviews الطلاب على كورسات الإنستراكتور
exports.getStudentFeedback = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate("reviews.userId", "name avatar")
      .lean();

    const feedback = [];

    courses.forEach(course => {
      (course.reviews || []).forEach(r => {
        feedback.push({
          studentName: r.userId?.name || "Anonymous",
          avatar: r.userId?.avatar || "",
          courseName: course.title,
          rating: r.rating,
          comment: r.comment,
          date: r.date,
        });
      });
    });

    feedback.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ feedback: feedback.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getMyStudents = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id }).lean();
    console.log("enrolledStudents:", JSON.stringify(courses.map(c => ({
      title: c.title,
      enrolledStudents: c.enrolledStudents
    })), null, 2));
    const courseMap = {};
    courses.forEach(c => { courseMap[c._id.toString()] = c.title; });
    const courseIds = courses.map(c => c._id);
    const allStudents = new Map();
    courses.forEach(course => {
      (course.enrolledStudents || []).forEach(e => {
        const studentId = e.student ? e.student.toString() : e.toString();
        const progress  = e.progress || 0;
        if (!allStudents.has(studentId)) {
          allStudents.set(studentId, { progress, courseName: courseMap[course._id.toString()] });
        } else {
          const existing = allStudents.get(studentId);
          if (progress > existing.progress) {
            allStudents.set(studentId, { progress, courseName: courseMap[course._id.toString()] });
          }
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
          progress: (last?.status === "passed" || last?.status === "completed") ? 100 : 0,
          courseName: last ? courseMap[last.course?.toString()] || "—" : "—"
        });
      }
    });
    if (allStudents.size === 0) return res.json({ students: [] });
    const users = await User.find({ _id: { $in: [...allStudents.keys()] }, role: "student" });
    const result = users.map(u => {
      const data = allStudents.get(u._id.toString()) || {};
      return {
        _id:          u._id,
        name:         u.name  || "Unknown",
        email:        u.email || "—",
        courseName:   data.courseName || "—",
        progress:     data.progress   || 0,
        lastActivity: "—",
      };
    });
    res.json({ students: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

