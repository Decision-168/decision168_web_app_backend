const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

router.get("/file-cabinet/fileit/project-detail-portfolio/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectDetailPortfolio(?)", [pid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-subtask/:stid", async (req, res) => {
    const {stid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_subtask(?)", [stid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/get-task-by-id/:tid", async (req, res) => {
    const {tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetTaskById(?)", [tid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/download_p-file-attachment/:id/:pfile_id", async (req, res) => {
    const {id, pfile_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL download_PFileAttachmentfile_it(?,?)", [id, pfile_id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/p-file-detail/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL pfile_detailfile_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-strategy/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_strategy_file_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-goal/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_goal_file_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-platform/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_platform_file_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-subtask-task/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkSubtaskTaskfile_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-subtask/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_subtask_file_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-task-project/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkTaskProjectfile_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-subtask-task/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkSubtaskTaskfile_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-project-strategy/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkProjectStrategyfile_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-task-project/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkTaskProjectfile_it(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-strategy-goal/:gid", async (req, res) => {
    const {gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkStrategyGoalfile_it(?)", [gid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-project-porfolio/:port_id", async (req, res) => {
    const {port_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkProjectPorfoliofile_it(?)", [port_id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-subtask-assignee-status/:stid", async (req, res) => {
    const {stid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_subtask_assignee_status(?)", [stid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-assignee-status/:tid", async (req, res) => {
    const {tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_assignee_status(?)", [tid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/fileit/check-task-subtasks2/:tid", async (req, res) => {
    const {tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itCheck_Task_Subtasks2(?)", [tid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/check-project-suggested-member/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_project_suggested_member(?)", [pid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/check-project-teammember/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itCheckProjectTeamMember(?)", [pid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/progress-done/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itprogress_done(?)", [pid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/progress-total/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itprogress_total(?)", [pid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/sub-progress-done/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itsub_progress_done(?)", [pid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/sub-progress-total/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itsub_progress_total(?)", [pid]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/subtask-detail/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSubtaskDetail(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/task-detail/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itTaskDetail(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/p-tasks/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itp_tasks(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/p-subtasks/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itp_subtasks(?)", [id]);
    res.json(rows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;