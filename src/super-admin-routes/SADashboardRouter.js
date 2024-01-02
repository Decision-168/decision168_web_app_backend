const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

//get registered users count
router.get("/super-admin/get-registered-users-count", async (req, res) => {
  try {
    const [rows] = await pool.execute("CALL SAcount_registered_list()");
    const registeredUsersCount = rows[0][0].count_rows;
    res.status(200).json(registeredUsersCount);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
