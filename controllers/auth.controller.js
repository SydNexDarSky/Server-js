const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/dbConnex");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

/**
 * REGISTER USER (STUDENT OR MENTOR)
 */
const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      first_name,
      last_name,
      role,
      phone,
      address,
      bio,
      avatar_url,
      email,
      password,
      ...profileData
    } = req.body;

    if (!first_name || !last_name || !role || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (role !== "student" && role !== "mentor") {
      return res.status(400).json({ message: "Invalid role" });
    }

    await client.query("BEGIN");

    // Check if user exists
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user (FIXED SCHEMA)
    const newUser = await client.query(
      `INSERT INTO users 
        (first_name, last_name, role, phone, address, bio, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, first_name, last_name, role`,
      [first_name, last_name, role, phone, address, bio, avatar_url]
    );

    const userId = newUser.rows[0].id;

    // Create profile table entry
    if (role === "student") {
      const { school, grade_level, interests } = profileData;

      await client.query(
        `INSERT INTO students (user_id, school, grade_level, interests)
         VALUES ($1, $2, $3, $4)`,
        [userId, school, grade_level, interests]
      );
    }

    if (role === "mentor") {
      const { expertise, years_of_experience } = profileData;

      await client.query(
        `INSERT INTO mentors (user_id, expertise, years_of_experience)
         VALUES ($1, $2, $3)`,
        [userId, expertise, years_of_experience]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  } finally {
    client.release();
  }
};

/**
 * LOGIN USER
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    // Find user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Get profile
    let profile = null;

    if (user.role === "student") {
      const result = await pool.query(
        "SELECT * FROM students WHERE user_id = $1",
        [user.id]
      );
      profile = result.rows[0];
    }

    if (user.role === "mentor") {
      const result = await pool.query(
        "SELECT * FROM mentors WHERE user_id = $1",
        [user.id]
      );
      profile = result.rows[0];
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password
    delete user.password_hash;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        ...user,
        profile
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  register,
  login
};