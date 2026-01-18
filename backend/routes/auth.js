

const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  res.json({ message: "Auth routes are working" });
});

module.exports = router;
