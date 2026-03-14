const Course = require("../models/courseSchema");

// GET /api/sessions/upcoming
exports.getUpcomingSessions = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });

    const allSessions = [];
    courses.forEach(course => {
      (course.sessions || []).forEach(session => {
        allSessions.push({
          _id:         session._id,
          title:       session.title,
          courseTitle: course.title,
          courseId:    course._id,
          date:        session.date,
          timeStart:   session.timeStart,
          timeEnd:     session.timeEnd,
        });
      });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = allSessions
      .filter(s => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ sessions: upcoming });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/sessions
// body: { courseId, title, date, timeStart, timeEnd }
exports.addSession = async (req, res) => {
  try {
    const { courseId, title, date, timeStart, timeEnd } = req.body;

    const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.sessions.push({ title, date: new Date(date), timeStart, timeEnd });
    await course.save();

    const added = course.sessions[course.sessions.length - 1];
    res.status(201).json({ message: "Session added", session: added });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/sessions/:id
// body: { courseId, title, date, timeStart, timeEnd }
exports.updateSession = async (req, res) => {
  try {
    const { courseId, title, date, timeStart, timeEnd } = req.body;

    const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const session = course.sessions.id(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (title)     session.title     = title;
    if (date)      session.date      = new Date(date);
    if (timeStart) session.timeStart = timeStart;
    if (timeEnd)   session.timeEnd   = timeEnd;

    await course.save();
    res.json({ message: "Session updated", session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/sessions/:id
// body or query: { courseId }
exports.deleteSession = async (req, res) => {
  try {
    const courseId = req.body.courseId || req.query.courseId;
    if (!courseId) return res.status(400).json({ error: "courseId is required" });

    const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const idx = course.sessions.findIndex(s => s._id.toString() === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Session not found" });

    course.sessions.splice(idx, 1);
    await course.save();

    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};