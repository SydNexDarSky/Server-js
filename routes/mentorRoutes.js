const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifyToken");

const {
  getMentors,
  getMentorProfile
} = require("../controllers/mentor.controller.js");

// PROTECTED ROUTES
router.get("/", verifyToken, getMentors);
router.get("/:id", verifyToken, getMentorProfile);

module.exports = router;