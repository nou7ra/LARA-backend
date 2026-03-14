const express = require("express");
const router  = express.Router();
const sessionController = require("../controllers/sessionController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.use(authorizeRoles("instructor"));

router.get("/upcoming", sessionController.getUpcomingSessions);
router.post("/",        sessionController.addSession);
router.put("/:id",      sessionController.updateSession);
router.delete("/:id",   sessionController.deleteSession);

module.exports = router;