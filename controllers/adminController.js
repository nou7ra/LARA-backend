const bcrypt = require("bcryptjs"); // ✅ في الأول
const Admin = require("../models/adminSchema");
const User = require("../models/userSchema");
const Instructor = require("../models/instructorSchema");
const Course = require("../models/courseSchema");
const Student = require("../models/studentSchema");
const jwt = require("jsonwebtoken");

// ======== LOGIN ========
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token, admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======== CREATE ADMIN ========
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, password: hashedPassword, role: "admin" });
    await admin.save();

    res.status(201).json({ message: "Admin created successfully", admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======== REGISTER ADMIN ========
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const user = new User({ name, email, password, role: "admin" });
    await user.save();
    res.status(201).json({ message: "Admin added to Users successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======== PROFILE ========
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bio, password } = req.body;
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (name)  admin.name  = name;
    if (email) admin.email = email;
    if (phone) admin.phone = phone;
    if (bio)   admin.bio   = bio;
    if (password) admin.password = await bcrypt.hash(password, 10);

    await admin.save();
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======== DASHBOARD STATS ========
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalCourses  = await Course.countDocuments();
    const courses = await Course.find({}, "enrolledStudents");
    const totalEnrollment = courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);

    res.json({ totalStudents, totalCourses, totalEnrollment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======== USERS MANAGEMENT ========
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find().select("-password");
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated", updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    if (deletedUser.role === "student") await Student.findOneAndDelete({ userId: req.params.id });
    else if (deletedUser.role === "instructor") await Instructor.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "Student not found" });
    await Student.findOneAndDelete({ userId: req.params.id });
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteInstructor = async (req, res) => {
  try {
    const deletedInstructor = await Instructor.findByIdAndDelete(req.params.id);
    if (!deletedInstructor) return res.status(404).json({ message: "Instructor not found" });
    if (deletedInstructor.userId) await User.findByIdAndDelete(deletedInstructor.userId);
    res.json({ message: "Instructor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ======== CHARTS DATA ========

// 1. Dropout Rate by Course Level
exports.getDropoutRateByLevel = async (req, res) => {
  try {
    const courses = await Course.find({}, "level enrolledStudents materials");
    const levelMap = {};

    courses.forEach(course => {
      const level = course.level || "Unknown";
      if (!levelMap[level]) levelMap[level] = { total: 0, dropped: 0 };
      (course.enrolledStudents || []).forEach(e => {
        levelMap[level].total++;
        const progress = e.progress || 0;
        if (progress < 100) levelMap[level].dropped++;
      });
    });

    const data = Object.entries(levelMap).map(([level, { total, dropped }]) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      rate: total > 0 ? Math.round((dropped / total) * 100 * 10) / 10 : 0,
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Dropout Comparison: All Students vs 3+ Domains
exports.getDropoutComparison = async (req, res) => {
  try {
    const courses = await Course.find({}, "enrolledStudents");
    const studentCourseCount = {};

    courses.forEach(course => {
      (course.enrolledStudents || []).forEach(e => {
        const id = e.student ? e.student.toString() : e.toString();
        studentCourseCount[id] = (studentCourseCount[id] || 0) + 1;
      });
    });

    const allIds = Object.keys(studentCourseCount);
    const multiIds = allIds.filter(id => studentCourseCount[id] >= 3);

    const allDropped = allIds.filter(id => {
      let maxProgress = 0;
      courses.forEach(c => {
        const e = c.enrolledStudents?.find(e => (e.student?.toString() || e.toString()) === id);
        if (e && (e.progress || 0) > maxProgress) maxProgress = e.progress || 0;
      });
      return maxProgress < 100;
    }).length;

    const multiDropped = multiIds.filter(id => {
      let maxProgress = 0;
      courses.forEach(c => {
        const e = c.enrolledStudents?.find(e => (e.student?.toString() || e.toString()) === id);
        if (e && (e.progress || 0) > maxProgress) maxProgress = e.progress || 0;
      });
      return maxProgress < 100;
    }).length;

    res.json([
      { category: "All Students", rate: allIds.length > 0 ? Math.round((allDropped / allIds.length) * 1000) / 1000 : 0 },
      { category: "3+ Domains",   rate: multiIds.length > 0 ? Math.round((multiDropped / multiIds.length) * 1000) / 1000 : 0 },
    ]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Repeated Courses
exports.getRepeatedCourses = async (req, res) => {
  try {
    const courses = await Course.find({}, "enrolledStudents");
    const studentCourseCount = {};

    courses.forEach(course => {
      (course.enrolledStudents || []).forEach(e => {
        const id = e.student ? e.student.toString() : e.toString();
        studentCourseCount[id] = (studentCourseCount[id] || 0) + 1;
      });
    });

    const total = Object.keys(studentCourseCount).length;
    const repeated = Object.values(studentCourseCount).filter(count => count > 1).length;
    const noRepeats = total - repeated;

    res.json([
      { name: "No Repeats",          value: total > 0 ? Math.round((noRepeats / total) * 100) : 0, color: "#D4B896" },
      { name: "Repeated 1+ Courses", value: total > 0 ? Math.round((repeated  / total) * 100) : 0, color: "#FFA500" },
    ]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Latest Activity
exports.getLatestActivity = async (req, res) => {
  try {
    const courses = await Course.find({}, "title enrolledStudents instructor")
      .populate("enrolledStudents.student", "name")
      .sort({ updatedAt: -1 })
      .limit(20);

    const activities = [];

    courses.forEach(course => {
      (course.enrolledStudents || []).forEach(e => {
        if (e.student && e.enrolledAt) {
          const date = new Date(e.enrolledAt);
          const now = new Date();
          const diffMs = now - date;
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const dateStr = diffDays < 1 ? "Today"
            : diffDays < 30 ? `${diffDays} days`
            : `${Math.floor(diffDays / 30)} months`;

          activities.push({
            id: e._id?.toString() || Math.random().toString(),
            name: e.student.name || "Unknown",
            activity: "Course enrolled",
            date: dateStr,
            time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          });
        }
      });
    });

    activities.sort((a, b) => a.date.localeCompare(b.date));
    res.json(activities.slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ======== COURSES MANAGEMENT ========
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("instructor", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInstructorById = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    res.json(instructor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.courseId);
    if (!deletedCourse) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Distribution of Domains per Student
exports.getDistributionData = async (req, res) => {
  try {
    const courses = await Course.find({}, "enrolledStudents");
    const studentCourseCount = {};

    courses.forEach(course => {
      (course.enrolledStudents || []).forEach(e => {
        const id = e.student ? e.student.toString() : e.toString();
        studentCourseCount[id] = (studentCourseCount[id] || 0) + 1;
      });
    });

    const distribution = {};
    Object.values(studentCourseCount).forEach(count => {
      distribution[count] = (distribution[count] || 0) + 1;
    });

    const data = Array.from({ length: 10 }, (_, i) => ({
      domain: i + 1,
      students: distribution[i + 1] || 0,
    }));

    const total = Object.values(distribution).reduce((s, v) => s + v, 0);
    const weightedSum = Object.entries(distribution).reduce((s, [k, v]) => s + Number(k) * v, 0);
    const average = total > 0 ? Math.round(weightedSum / total) : 0;

    res.json({ data, average });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Pending Approvals (Instructors not yet assigned to any course)
exports.getPendingApprovals = async (req, res) => {
  try {
    const instructors = await Instructor.find({}, "name email");
    const courses = await Course.find({}, "instructor");
    const assignedIds = new Set(courses.map(c => c.instructor?.toString()));

    const pending = instructors
      .filter(i => !assignedIds.has(i._id.toString()))
      .slice(0, 5)
      .map((i, idx) => ({
        id: idx + 1,
        text: `New instructor: ${i.name}`,
        type: "instructor",
      }));

    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};