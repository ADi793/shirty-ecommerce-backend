const express = require("express");
require("express-async-errors");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to Shirty!...");
});

module.exports = router;
