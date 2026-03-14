// resetAndTestLogin.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/userSchema");

// -------------------- Connect MongoDB --------------------
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// -------------------- Reset & Test Login --------------------
async function resetAndLogin({ email, userId, newPassword }) {
    try {
        // 🔹 تنظيف الباسورد من أي مسافات
        if (!newPassword) {
            console.log("No newPassword provided!");
            return;
        }
        newPassword = newPassword.trim();

        if (newPassword.length < 6) {
            console.log("Password must be at least 6 characters.");
            return;
        }

        // 🔎 البحث عن المستخدم بالإيميل أو بالـ userId
        let user = null;
        if (email) {
            user = await User.findOne({ email: email.toLowerCase() });
        } else if (userId) {
            user = await User.findById(userId);
        }

        if (!user) {
            console.log("User not found!");
            return;
        }

        console.log("User found:", {
            id: user._id,
            email: user.email,
            mustResetPassword: user.mustResetPassword
        });

        // 🔥 إعادة تعيين الباسورد
        user.password = newPassword; // pre-save في الـ schema هيعمل hash تلقائي
        user.mustResetPassword = false;
        await user.save();
        console.log(`Password reset successfully for: ${user.email}`);

        // 🔑 تجربة تسجيل الدخول بالباسورد الجديد
        const isMatch = await user.comparePassword(newPassword);
        if (!isMatch) {
            console.log("Login failed: password mismatch!");
            return;
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        console.log("Login successful!");
        console.log("Token:", token);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

// -------------------- تنفيذ الريسيت --------------------
// حطي هنا الايميل أو الـ userId + الباسورد الجديد
resetAndLogin({
    email: "nouRRra@example.com", // أو userId: "697f377ada1f3b091cca9a91"
    newPassword: "Noura1234"
});
