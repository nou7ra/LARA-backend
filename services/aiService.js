// Backend/services/aiService.js
const axios = require('axios');

const getInitialRecommendations = async (userData) => {
    try {
        // نستخدم الرابط الذي فتحتِه في المتصفح
        const response = await axios.post('http://127.0.0.1:8000/recommend', {
            interests: userData.interests,
            skills: userData.skills,
            previous_courses: userData.previous_courses || [],
            current_level: "Beginner",
            exam_score: 60, // قيمة افتراضية للطالب الجديد
            full_name: userData.name
        });
        
        return response.data.recommendations; // مصفوفة الكورسات المقترحة
    } catch (error) {
        console.error("AI Connection Error:", error.message);
        return [];
    }
};