const jwt = require("jsonwebtoken");

// دالة التحقق من التوكن
const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // تحديد الـ Role تلقائياً من الـ URL لو مش موجود في التوكن
    let role = decoded.role;
    if (!role) {
      const url = req.originalUrl;
      if (url.includes("/student")) role = "student";
      else if (url.includes("/instructor")) role = "instructor";
      else if (url.includes("/admin")) role = "admin";
      else role = "guest";
    }

    req.user = { id: decoded.id, email: decoded.email, role: role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// دالة التحقق من الصلاحيات
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access forbidden: insufficient permissions" });
    }
    next();
  };
};

// التصدير الصحيح
module.exports = { authMiddleware, authorizeRoles };