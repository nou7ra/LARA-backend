// =======================================================
// User Schema
// =======================================================
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// =======================================================
// تعريف سكيمه المستخدم
// =======================================================
const userSchema = new mongoose.Schema(
  {
    // الاسم الكامل
    name: { type: String, required: true },

    // الإيميل
    email: { type: String, required: true, unique: true, lowercase: true },

    // كلمة السر
    password: { type: String, required: true },

    // دور المستخدم
    role: {
      type: String,
      enum: ["user", "student", "admin", "instructor"],
      default: "user",
    },

    // لتحديد إذا كان المستخدم لازم يغير الباسورد
    mustResetPassword: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// =======================================================
// Pre-save: تشفير الباسورد قبل الحفظ
// =======================================================
userSchema.pre("save", async function () {
  try {
    // لو الباسورد متبدلش أو مفيش تغيير، اخرج فوراً
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // مش محتاجين next() هنا طالما الدالة async
  } catch (err) {
    // لو حصل خطأ ارميه وهيوصل للـ Controller
    throw new Error(err);
  }
});
// =======================================================
// Method: مقارنة الباسورد
// =======================================================
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error("Error comparing password:", err);
    return false;
  }
};

// =======================================================
// Export الموديل
// =======================================================
module.exports = mongoose.model("User", userSchema, "users"); 
// الكوليكشن النهائية هي "users"
