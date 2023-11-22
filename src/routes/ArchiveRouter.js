const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

router.get("/archive/portfolio/:in_reg_id", async (req, res) => {
    const {in_reg_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL ArchivePortfolio(?)", [in_reg_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/tasks/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL ArchiveTasks(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/singletasks/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL ArchiveSingleTasks(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/projects/:in_portfolio_id/:in_pcreated_by", async (req, res) => {
    const {in_portfolio_id,in_pcreated_by} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL ArchiveProjects(?,?)", [in_portfolio_id,in_pcreated_by]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/subtasks/:in_portfolio_id/:in_reg_id", async (req, res) => {
    const {in_portfolio_id,in_reg_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL ArchiveSubtasks(?,?)", [in_portfolio_id,in_reg_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/singlesubtasks/:in_portfolio_id/:in_reg_id", async (req, res) => {
    const {in_portfolio_id,in_reg_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL ArchiveSingleSubtasks(?,?)", [in_portfolio_id,in_reg_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/goals/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL ArchiveGoals(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/strategies/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL ArchiveStrategies(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/projectdetail/:in_reg_id/:in_pid", async (req, res) => {
    const {in_reg_id,in_pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archiveProjectDetail(?,?)", [in_reg_id,in_pid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/getprojectalltasknotarc/:in_pid", async (req, res) => {
    const {in_pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archivegetProjectAllTaskNotArc(?)", [in_pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/getprojectallsubtasknotarc/:in_pid", async (req, res) => {
    const {in_pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archivegetProjectAllSubtaskNotArc(?)", [in_pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/check_donetask/:in_tid", async (req, res) => {
    const {in_tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archivecheck_Donetask(?)", [in_tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/gettaskallsubtasknotarc/:in_tid", async (req, res) => {
    const {in_tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archivegetTaskAllSubtaskNotArc(?)", [in_tid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/check_donesubtask/:in_stid", async (req, res) => {
    const {in_stid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archivecheck_Donesubtask(?)", [in_stid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/getprojectbyid/:in_pid", async (req, res) => {
    const {in_pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archivegetProjectById(?)", [in_pid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/goaldetail/:in_gid", async (req, res) => {
    const {in_gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archiveGoalDetail(?)", [in_gid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/goal_tasks/:in_gid", async (req, res) => {
    const {in_gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archiveGoal_tasks(?)", [in_gid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/goal_subtasks/:in_gid", async (req, res) => {
    const {in_gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archiveGoal_subtasks(?)", [in_gid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/strategydetail/:in_sid", async (req, res) => {
    const {in_sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archiveStrategyDetail(?)", [in_sid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/strategy_tasks/:in_sid", async (req, res) => {
    const {in_sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archiveStrategy_tasks(?)", [in_sid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/strategy_subtasks/:in_sid", async (req, res) => {
    const {in_sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL archiveStrategy_subtasks(?)", [in_sid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/checkprojectporfolio/:in_portfolio_id", async (req, res) => {
    const {in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkProjectPorfolioArchive(?)", [in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/checkprojectstrategy/:in_sid", async (req, res) => {
    const {in_sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkProjectStrategyArchive(?)", [in_sid]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/checkstrategygoal/:in_gid", async (req, res) => {
    const {in_gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkStrategyGoalArchive(?)", [in_gid]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/checktaskproject/:in_pid", async (req, res) => {
    const {in_pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkTaskProjectArchive(?)", [in_pid]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/check-goal/:in_reg_id/:in_gid", async (req, res) => {
    const {in_reg_id,in_gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_goal_archive(?,?)", [in_reg_id,in_gid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/check-project/:in_pid/:in_pcreated_by", async (req, res) => {
    const {in_pid,in_pcreated_by} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_project_archive(?,?)", [in_pid,in_pcreated_by]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/check-strategy/:in_reg_id/:in_sid", async (req, res) => {
    const {in_reg_id,in_sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_strategy_archive(?,?)", [in_reg_id,in_sid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/check-subtask/:in_stid", async (req, res) => {
    const {in_stid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_subtask_archive(?)", [in_stid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/archive/check-task/:in_tid", async (req, res) => {
    const {in_tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_task_archive(?)", [in_tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;