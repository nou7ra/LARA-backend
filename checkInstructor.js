// checkInstructorsConsole.js
require("dotenv").config();
const mongoose = require("mongoose");
const Instructor = require("./models/instructorSchema"); // موديل الانستراكتور

// الاتصال بالـ DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function checkInstructors() {
  try {
    const instructors = await Instructor.find().select("-password -__v"); // نخفي الباسورد
    console.log("=== Instructors in DB ===");
    console.log(instructors);
    console.log("Total:", instructors.length);
  } catch (err) {
    console.error("Error fetching instructors:", err);
  } finally {
    mongoose.connection.close();
  }
}

checkInstructors();
