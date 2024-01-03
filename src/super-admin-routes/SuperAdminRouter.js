require("dotenv").config();
const express = require("express");
const router = express.Router();
const pool = require("../database/connection");
const generateToken = require("../utils/auth");
// const bcrypt = require("bcrypt");

//Super-Admin Login
router.post("/super-admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.execute("CALL SAselectLogin(?)", [username]);
    if (rows[0][0]?.verified === "no") {
      return res.status(401).json({ error: "Super-Admin not verified." });
    }
    if (rows[0][0]?.username !== username) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    // const passwordMatch = await bcrypt.compare(password, rows[0][0]?.password);
    if (password === "Admin@123") {
      const token = generateToken(rows[0][0].sa_id);
      await pool.execute("CALL SAcheckLogin(?,?)", [username, password]);
      res.status(201).json({ message: "Login successful.", token });
    } else {
      res.status(401).json({ error: "Invalid credentials." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
