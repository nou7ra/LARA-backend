const mongoose = require('mongoose');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const enrollmentSchema = new mongoose.Schema({
    enrollment_id: Number,
    course_id: Number,
    progress: { type: Number, min: 0, max: 100 },
    status: String,
    start_date: String,
    exam_score: Number,
    recommended_video: String,
    full_name: { type: String, required: [true, 'Full name is required'] },
    email: { 
        type: String,
        match: [emailRegex, 'Invalid email address']
    },
    preferred_language: String,

    // ✅ هنا تمّ تصحيح أنواع الـ fields فقط:
    interests: { type: [String], default: [] },
    skill_level: String,
    created_at: String,
    category: String,
    subcategory: String,
    level: String,
    duration_hours: Number,
    rating: Number,
    "registered-students": Number,
    price: String,
    url: String,
    "Pre-course-exam_score": Number,

    // ✅ تصحيح دول كمان
    user_input_skills: { type: [String], default: [] },
    previous_courses: { type: [String], default: [] }
});

// نفس اللي عندك بالظبط — ماغيّرتش أي شيء
module.exports = mongoose.model('Enrollment', enrollmentSchema, 'student');
