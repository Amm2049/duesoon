// GET /courses (SPEC §4.2). Mounted behind requireAuth in index.js.
const express = require("express");
const courses = require("../repos/courses");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json(await courses.listCourses());
});

module.exports = router;
