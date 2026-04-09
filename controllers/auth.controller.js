const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 *  REGISTER USER
 */
const register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // if user exists
    const userExists = await pool.query(
      "SELECT * FROM students WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newStudent = await pool.query(
      `INSERT INTO students (firstname, lastname, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, firstname, lastname, email, created_at`,
      [firstname, lastname, email, hashedPassword]
    );

    // Create token
    const token = jwt.sign(
      { id: newUser.rows[0].id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Student created successfully",
      student: newUser.rows[0],
      token
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



/**
 *  LOGIN USER
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Create token
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  register,
  login
};