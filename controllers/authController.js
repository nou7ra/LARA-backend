const { getInitialRecommendations } = require("../services/aiService");
const User = require("../models/userSchema");
const Student = require("../models/studentSchema");
const jwt = require("jsonwebtoken");

// -------------------- REGISTER --------------------
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ==== Check if email already exists ====
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // ==== Create User ====
    const user = new User({
      name,
      email: email.toLowerCase(),
      password, // hashing occurs in pre-save
      role: role || "student",
    });

    await user.save();
    console.log("✅ User saved:", user._id);

    let newStudent = null;

    // ==== Create Student if role is student ====
    if (user.role === "student") {
      newStudent = new Student({
        userId: user._id,
        full_name: name,
        email: email.toLowerCase(),
        interests: [],
        skills: [],
        previousCourses: [],
        completedCourses: [],
        recommended_video: null
      });

      await newStudent.save();
      console.log("✅ Student profile created for user:", user.email, newStudent._id);
    }

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      studentId: newStudent ? newStudent._id : null,
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message });
  }
};

// -------------------- LOGIN --------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ التعديل هنا: جلب البروفايل بناءً على الدور
    let profileData = null;
    
    if (user.role === "student") {
      profileData = await Student.findOne({ userId: user._id }).select("-__v");
    } else if (user.role === "instructor") {
      // إذا كان لديكِ سكيما للمدربين، استدعيها هنا
      // const Instructor = require("../models/instructorSchema");
      // profileData = await Instructor.findOne({ userId: user._id });
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: profileData || null // نغير الاسم ليكون عاماً (profile) بدلاً من studentProfile
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
};

// -------------------- RESET PASSWORD --------------------
exports.resetPassword = async (req, res) => {
  try {
    let { email, userId, newPassword } = req.body;

    if (!newPassword)
      return res.status(400).json({ message: "New password is required" });

    newPassword = newPassword.trim();

    if (newPassword.length < 6)
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });

    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else if (userId) {
      user = await User.findById(userId);
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    user.mustResetPassword = false;

    await user.save();
    console.log("✅ User password reset:", user._id);

    // ==== Fetch or Auto-create Student Profile ====
    let studentData = await Student.findOne({ userId: user._id }).select("-__v");
    if (!studentData && user.role === "student") {
      studentData = new Student({
        userId: user._id,
        full_name: user.name,
        email: user.email,
        interests: [],
        skills: [],
        previousCourses: [],
        completedCourses: [],
        recommended_video: null
      });
      await studentData.save();
      console.log("✅ Student profile auto-created for user after reset:", user._id);
    }

    res.json({
      message: "Password reset successfully",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfile: studentData || null
      }
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: err.message });
  }
};

// -------------------- UPDATE PROFILE --------------------
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. تحديث بيانات الـ User الأساسية
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email.toLowerCase();
    await user.save();
    console.log("✅ User updated:", user._id);

    // 2. البحث عن بروفايل الطالب أو إنشاؤه
    let studentData = await Student.findOne({ userId: user._id });
    if (!studentData && user.role === "student") {
      studentData = new Student({
        userId: user._id,
        full_name: user.name,
        email: user.email,
        interests: [],
        skills: [],
        previousCourses: [],
        completedCourses: [],
        recommended_video: null
      });
      await studentData.save();
    }

    if (studentData) {
      // تحديث بيانات الطالب الحالية
      if (updateData.full_name) studentData.full_name = updateData.full_name;
      if (updateData.interests) studentData.interests = updateData.interests;
      if (updateData.skills) studentData.skills = updateData.skills;
      if (updateData.previousCourses) studentData.previousCourses = updateData.previousCourses;
      if (updateData.completedCourses) studentData.completedCourses = updateData.completedCourses;
      if (updateData.recommended_video) studentData.recommended_video = updateData.recommended_video;

      await studentData.save();
      console.log("✅ Student profile updated:", studentData._id);

      // --- 🤖 الجزء الجديد: نداء الـ AI 🤖 ---
      let aiRecommendations = [];
      
      // إذا قام الطالب بتحديث اهتماماته أو مهاراته، نطلب التوصيات
      if (updateData.interests || updateData.skills) {
        console.log("🤖 Requesting recommendations from AI server...");
        try {
          aiRecommendations = await getInitialRecommendations({
            name: user.name,
            interests: studentData.interests,
            skills: studentData.skills,
            previous_courses: studentData.previousCourses || []
          });
        } catch (aiErr) {
          console.error("AI Service failed, but profile was saved:", aiErr.message);
          // لا نوقف العملية إذا فشل الـ AI، فقط نرسل مصفوفة فارغة
        }
      }

      // 3. إرسال الرد النهائي ومعه التوصيات
      return res.json({
        message: "Profile updated successfully",
        user: {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentProfile: studentData || null,
          recommendedCourses: aiRecommendations // الكورسات اللي الـ AI اقترحها
        }
      });
    }

    res.json({ message: "Profile updated", user });

  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: err.message });
  }
};
// -------------------- Helper: Handle Social Login --------------------
const handleSocialLogin = async (profile, role = "student") => {
  if (!profile) throw new Error("No profile provided");

  const email = profile.emails?.[0]?.value?.toLowerCase() || `${profile.id}@social.com`;
  const name = profile.displayName || "User";

  // Check if user exists
  let user = await User.findOne({ email });

  // Create new user if not exists
  if (!user) {
    user = new User({
      name,
      email,
      password: Math.random().toString(36).substring(7),
      role,
    });
    await user.save();
    console.log("🆕 New social user created:", user._id);
  }

  // Create Student Profile if role = student
  let studentProfile = null;
  if (user.role === "student") {
    studentProfile = await Student.findOne({ userId: user._id });
    if (!studentProfile) {
      studentProfile = new Student({
        userId: user._id,
        full_name: name,
        email,
        interests: [],
        skills: [],
        previousCourses: [],
        completedCourses: [],
        recommended_video: null
      });
      await studentProfile.save();
      console.log("🆕 Student profile created:", studentProfile._id);
    }
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { token, user, studentProfile };
};

// -------------------- GOOGLE CALLBACK --------------------
exports.googleCallback = async (req, res) => {
  try {
    const profile = req.user;
    const { token, user } = await handleSocialLogin(profile, "student");

    // ✅ redirect للفرونت مع الـ token
    return res.redirect(
      `http://localhost:3001/auth/callback?token=${token}&name=${encodeURIComponent(user.name)}&role=${user.role}&userId=${user._id}`
    );
  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect("http://localhost:3001/login?error=google_failed");
  }
};

// -------------------- FACEBOOK CALLBACK --------------------
exports.facebookCallback = async (req, res) => {
  try {
    const profile = req.user;
    const { token, user, studentProfile } = await handleSocialLogin(profile, "student");

    return res.json({
      message: "Login successful",
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfile: studentProfile || null
      }
    });
  } catch (err) {
    console.error("Facebook callback error:", err);
    res.status(500).json({ message: "Facebook auth error" });
  }
};