const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user
  });
});

router.get("/admin-only", authMiddleware, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "Welcome admin!" });
});

module.exports = router;
