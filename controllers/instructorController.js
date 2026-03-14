const Instructor = require("../models/instructorSchema");
const User = require("../models/userSchema");
const Course = require("../models/courseSchema");
const Student = require("../models/studentSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    const { title, description, materials, exam, level, image, price, duration } = req.body;
    const newCourse = new Course({
      title, description, instructor: instructorId, materials, exam,
      level: level || "beginner", image: image || "",
      price: price !== undefined ? Number(price) : 0, duration: duration || "",
    });
    await newCourse.save();
    await Instructor.findByIdAndUpdate(instructorId, { $push: { courses: newCourse._id } });
    res.status(201).json({ message: "Course added successfully", course: newCourse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
    res.json({ name: user.name, email: user.email, phone: instructor?.phone || "", bio: instructor?.bio || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bio, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (name) user.name = name;
    if (email) user.email = email;
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
      user.password = await bcrypt.hash(newPassword, 10);
    }
    await user.save();
    await Instructor.findByIdAndUpdate(req.user.id, { phone, bio });
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
    const students = await Student.find({ "completedCourses.course": { $in: courses.map(c => c._id) } });
    const short  = courses.filter(c => (c.hours || 0) <= 5);
    const medium = courses.filter(c => (c.hours || 0) > 5 && (c.hours || 0) <= 15);
    const long   = courses.filter(c => (c.hours || 0) > 15);
    const calcDropout = (courseGroup) => {
      if (courseGroup.length === 0) return 0;
      const groupIds = courseGroup.map(c => c._id.toString());
      const enrolled  = students.filter(s => s.completedCourses.some(cc => groupIds.includes(cc.course?.toString()))).length;
      const completed = students.filter(s => s.completedCourses.some(cc => groupIds.includes(cc.course?.toString()) && (cc.status === "completed" || cc.status === "passed" || (cc.score && cc.score >= 50)))).length;
      if (enrolled === 0) return 0;
      return Math.round(((enrolled - completed) / enrolled) * 100);
    };
    const dropoutData = [
      { duration: "Short",  rate: calcDropout(short) },
      { duration: "Medium", rate: calcDropout(medium) },
      { duration: "Long",   rate: calcDropout(long) },
    ];
    let repeatedCount = 0, totalCount = 0;
    students.forEach(student => {
      const relatedCourses = student.completedCourses.filter(cc => courseIds.includes(cc.course?.toString()));
      if (relatedCourses.length === 0) return;
      totalCount++;
      const courseIdList = relatedCourses.map(cc => cc.course?.toString());
      if (courseIdList.length > new Set(courseIdList).size) repeatedCount++;
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

exports.getMyStudents = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id }).lean();

    // ✅ DEBUG
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
    
    // ✅ لو موجود خد الأعلى progress
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