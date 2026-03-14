const mongoose = require('mongoose');
const Enrollment = require('./models/schema');

mongoose.connect("mongodb+srv://nourhan:nouramo530@cluster0.3qbgdxi.mongodb.net/Grad2025DB")
  .then(async () => {
    console.log("Connected to MongoDB!");

    // طباعة كل الأسماء بالظبط مع علامات اقتباس لتشوف أي فراغات
    const students = await Enrollment.find({});
    students.forEach(s => console.log("${s.full_name}"));

    // اختبار فلترة مباشر
    const nameToSearch = "James Moore"; // حطي الاسم بالضبط زي ما ظهر
    const filtered = await Enrollment.find({
      full_name: { $regex: new RegExp(nameToSearch, 'i') }
    });
    console.log("Filtered result:", filtered);

    mongoose.disconnect();
  })
  .catch(err => console.error(err));