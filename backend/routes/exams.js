

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Exams routes are working" });
});

router.post("/", (req, res) => {
  res.json({ message: "Exam created successfully" });
});

module.exports = router;
