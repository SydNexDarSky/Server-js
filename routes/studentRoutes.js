const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifyToken");

const {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} = require("../controllers/student.controller.js");

// PROTECTED ROUTES
router.get("/", verifyToken, getStudents);
router.get("/:id", verifyToken, getStudentById);
router.put("/:id", verifyToken, updateStudent);
router.delete("/:id", verifyToken, deleteStudent);

module.exports = router;