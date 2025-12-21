

const express = require("express");
const router = express.Router();

router.post("/manual", (req, res) => {
  res.json({ message: "Manual grading endpoint" });
});

module.exports = router;
