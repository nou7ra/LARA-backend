require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/userSchema");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB!");

    const users = await User.find().lean(); // هيرجع كل ال users
    console.log("📄 All users in DB:", users);

    mongoose.connection.close();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
