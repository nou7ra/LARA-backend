# 🎓 LARA - Learning Management System (Backend)

LARA is a full-stack Learning Management System built as a graduation project. This repository contains the **Node.js/Express backend** with MongoDB database.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Authentication:** JWT (JSON Web Tokens) + bcrypt
- **API Docs:** Swagger UI
- **Other:** Passport.js, Multer, CORS, dotenv

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| 🎓 Student | Browse courses, enroll, take exams, track progress |
| 👨‍🏫 Instructor | Add courses, manage sessions, view students |
| 👨‍💼 Admin | Manage all users, courses, and platform stats |

---

## 📁 Project Structure
```
graduation-project/
├── controllers/
│   ├── studentController.js
│   ├── instructorController.js
│   └── adminController.js
├── models/
│   ├── userSchema.js
│   ├── courseSchema.js
│   ├── studentSchema.js
│   └── instructorSchema.js
├── routes/
│   ├── students.js
│   ├── instructor.js
│   ├── admin.js
│   └── auth.js
├── middleware/
│   └── authMiddleware.js
├── config/
│   └── passport.js
├── server.js
└── .env
```

---

## 🔗 API Endpoints

### 🔐 Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |

### 🎓 Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/students/register` | Register student |
| POST | `/students/login` | Student login |
| GET | `/students/courses` | Get all courses |
| POST | `/students/enroll` | Enroll in a course |
| POST | `/students/save-progress` | Save course progress |
| GET | `/students/sessions` | Get all sessions |
| GET | `/students/course-exam/:courseId` | Get course exam |
| POST | `/students/submit-exam/:courseId` | Submit exam |
| POST | `/students/review` | Submit course review |
| GET | `/students/recommendation` | Get personalized recommendations |

### 👨‍🏫 Instructor
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/instructor/register` | Register instructor |
| POST | `/instructor/login` | Instructor login |
| POST | `/instructor/add-full-course` | Add a new course |
| GET | `/instructor/my-courses` | Get instructor courses |
| GET | `/instructor/my-students` | Get enrolled students |
| POST | `/instructor/add-session` | Add a live session |
| GET | `/instructor/my-sessions` | Get all sessions |
| GET | `/instructor/dashboard-stats` | Get dashboard statistics |
| GET | `/instructor/analytics` | Get analytics data |
| GET/PUT | `/instructor/profile` | Get/Update profile |

### 👨‍💼 Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Admin login |
| GET | `/admin/students` | Get all students |
| GET | `/admin/instructors` | Get all instructors |
| GET | `/admin/courses` | Get all courses |
| DELETE | `/admin/student/:id` | Delete student |
| DELETE | `/admin/instructor/:id` | Delete instructor |
| DELETE | `/admin/course/:id` | Delete course |
| GET | `/admin/dashboard-stats` | Get platform statistics |
| GET | `/admin/charts/*` | Get chart data |
| GET/PUT | `/admin/profile` | Get/Update admin profile |

---

## ⚙️ Setup & Installation
```bash
# 1. Clone the repository
git clone https://github.com/nou7ra/LARA-backend.git

# 2. Install dependencies
cd LARA-backend
npm install

# 3. Create .env file
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000

# 4. Run the server
node server.js
```

---

## 📖 API Documentation

After running the server, visit:
```
http://localhost:3000/api-docs
```

---

## 👩‍💻 Developed By

**Nourhan mohamed** — Graduation Project 2025