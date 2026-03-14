const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/userSchema"); // عدلي المسار لو محتاج

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

async function testReset(userEmail, newPassword) {
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) return console.log("User not found");

    console.log("Before reset, password in DB:", user.password);

    user.password = newPassword;
    user.mustResetPassword = false;
    await user.save();

    console.log("After reset, password in DB:", user.password);

    const match = await user.comparePassword(newPassword);
    console.log("Password match after reset?", match);
}

testReset("user3@example.com", "Noura1234")
  .then(() => mongoose.disconnect());
