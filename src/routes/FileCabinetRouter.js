const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

router.get("/file-cabinet/:portfolio_id", async (req, res) => {
    const {portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL get_PortfolioDepartment(?)", [portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/files/:portfolio_id", async (req, res) => {
  const {portfolio_id} = req.params
try {
  const [rows, fields] = await pool.execute("CALL get_PortfolioDepartment(?)", [portfolio_id]);
  res.status(200).json(rows[0]);
} catch (error) {
  console.error("Error executing stored procedure:", error);
  res.status(500).json({ error: "Internal Server Error" });
}
});

router.get("/file-cabinet/file-it/goal/:goal_id/:user_id", async (req, res) => {
  const {goal_id,user_id} = req.params
try {
  const [rows, fields] = await pool.execute("CALL file_itGoalDetail(?)", [goal_id]);
  res.status(200).json(rows[0][0]);
} catch (error) {
  console.error("Error executing stored procedure:", error);
  res.status(500).json({ error: "Internal Server Error" });
}
});

module.exports = router;