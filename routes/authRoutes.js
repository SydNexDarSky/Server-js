const express = require("express");
const router = express.Router();

const {
  register,
  login,
  requestReset,
  resetPassword
} = require("../controllers/auth.controller");

// =========================
// PUBLIC AUTH ROUTES
// =========================

// Register new user (student or mentor)
router.post("/register", register);

// Login user
router.post("/login", login);

// Request password reset email
router.post("/request-reset", requestReset);

// Reset password using token
router.post("/reset-password", resetPassword);

module.exports = router;