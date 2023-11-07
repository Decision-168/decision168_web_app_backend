const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

router.get("/user/get-user", async (req, res) => {
  try {
    const [rows, fields] = await pool.execute("CALL getRegUsers()");
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/user/get-user/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL getRegUsersByID(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
