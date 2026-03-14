const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("passport");

// =======================
// Email / Password Auth
// =======================
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);

// =======================
// Google Auth
// =======================
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authController.googleCallback
);

// =======================
// Facebook Auth
// =======================
router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  authController.facebookCallback
);

module.exports = router;
