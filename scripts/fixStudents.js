require("dotenv").config();
const mongoose = require("mongoose");

// ======================
// اتصال MongoDB
// ======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB!", "DB:", mongoose.connection.name))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ======================
// موديلز
// ======================
const User = require("../models/userSchema");
const Student = require("../models/studentSchema");

// ======================
// إضافة Student Profile مفقود للطلاب فقط
// ======================
async function addMissingStudents() {
  try {
    console.log("Student collection:", Student.collection.name);

    // جلب كل الـ users اللي role = "student"
    const studentsUsers = await User.find({ role: "student" });
    console.log(`Found ${studentsUsers.length} student users.`);

    let createdCount = 0;

    for (const user of studentsUsers) {
      console.log("\nChecking user:", user._id, user.name, user.email);

      // ✅ التأكد من الحقل الأساسي فقط
      if (!user.email) {
        console.log(`Skipping user ${user._id} because email is missing`);
        continue;
      }

      // شوف إذا فيه Student Profile موجود
      const existingStudent = await Student.findOne({ userId: user._id });
      if (existingStudent) {
        console.log(`Student Profile already exists for ${user.email}`);
        continue;
      }

      // محاولة الإضافة
      try {
        const newStudent = await Student.create({
          userId: user._id,
          full_name: user.name || "No Name Provided",
          email: user.email,
          interests: user.interests || ["Programming", "Math", "Science"],
          skills: user.skills || ["Problem Solving", "Communication"],
          previousCourses: user.previousCourses || ["Intro to CS", "Basic Math"],
          completedCourses: [],
        });
        createdCount++;
        console.log(`✅ Added Student Profile for ${user.email} (ID: ${newStudent._id})`);
      } catch (err) {
        console.error(`❌ Error adding student ${user.email}:`, err.message);
      }
    }

    console.log(`\n✅ Done! Created ${createdCount} missing student profiles.`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

// تشغيل السكريبت
addMissingStudents();
