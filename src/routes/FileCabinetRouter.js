const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection

router.get("/file-cabinet/file-it/project-detail-portfolio/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectDetailPortfolio(?)", [pid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-subtask/:stid", async (req, res) => {
    const {stid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_subtask(?)", [stid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/get-task-by-id/:tid", async (req, res) => {
    const {tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetTaskById(?)", [tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-task/:tid", async (req, res) => {
    const {tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetTaskById(?)", [tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getmemberproject/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetMemberProject(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/download-p-file-attachment/:id/:pfile_id", async (req, res) => {
    const {id, pfile_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL download_PFileAttachmentfile_it(?,?)", [id, pfile_id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/p-file-detail/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL pfile_detailfile_it(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-strategy/:in_reg_id/:in_sid", async (req, res) => {
    const {in_reg_id,in_sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_strategy_file_it(?,?)", [in_reg_id,in_sid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-goal/:in_reg_id/:in_gid", async (req, res) => {
    const {in_reg_id,in_gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_goal_file_it(?,?)", [in_reg_id,in_gid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-subtask-task/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkSubtaskTaskfile_it(?)", [id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-subtask/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL check_subtask_file_it(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-task-project/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkTaskProjectfile_it(?)", [id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-subtask-task/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkSubtaskTaskfile_it(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-project-strategy/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkProjectStrategyfile_it(?)", [id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-task-project/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkTaskProjectfile_it(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-strategy-goal/:gid", async (req, res) => {
    const {gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkStrategyGoalfile_it(?)", [gid]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-project-porfolio/:port_id", async (req, res) => {
    const {port_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL checkProjectPorfoliofile_it(?)", [port_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-subtask-assignee-status/:in_reg_id/:in_stid", async (req, res) => {
    const {in_reg_id,in_stid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_subtask_assignee_status(?,?)", [in_reg_id,in_stid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-assignee-status/:in_reg_id/:in_tid", async (req, res) => {
    const {in_reg_id,in_tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_assignee_status(?,?)", [in_reg_id,in_tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-task-subtasks2/:tid", async (req, res) => {
    const {tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itCheck_Task_Subtasks2(?)", [tid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-project-suggested-member/:in_suggest_id/:in_pid", async (req, res) => {
    const {in_suggest_id,in_pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_project_suggested_member(?,?)", [in_suggest_id,in_pid]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/project-file/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectFile(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-project-teammember/:in_pmember/:in_pid", async (req, res) => {
    const {in_pmember,in_pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itCheckProjectTeamMember(?,?)", [in_pmember,in_pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/progress-done/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itprogress_done(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/progress-total/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itprogress_total(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/sub-progress-done/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itsub_progress_done(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/sub-progress-total/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itsub_progress_total(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/subtask-detail/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSubtaskDetail(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/task-detail/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itTaskDetail(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/p-tasks/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itp_tasks(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/p-subtasks/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itp_subtasks(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/p-subtasks/:in_pid/:in_reg_id", async (req, res) => {
    const {in_pid,in_reg_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itEdit_Team_Members(?,?)", [in_pid,in_reg_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategy-all-projects-list/:get_strategy_id", async (req, res) => {
    const {get_strategy_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategyAllProjectsList(?)", [get_strategy_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goals-all-strategies-list/:get_goal_id", async (req, res) => {
    const {get_goal_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalsAllStrategiesList(?)", [get_goal_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategyprogress-done/:sid", async (req, res) => {
    const {sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategyprogress_done(?)", [sid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategyprogress-total/:sid", async (req, res) => {
    const {sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategyprogress_total(?)", [sid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategysub-progress-done/:sid", async (req, res) => {
    const {sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategysub_progress_done(?)", [sid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategysub-progress-total/:sid", async (req, res) => {
    const {sid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategysub_progress_total(?)", [sid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goalprogress-done/:gid", async (req, res) => {
    const {gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalprogress_done(?)", [gid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goalprogress-total/:gid", async (req, res) => {
    const {gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalprogress_total(?)", [gid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goalsub-progress-done/:gid", async (req, res) => {
    const {gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalsub_progress_done(?)", [gid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goalsub-progress-total/:gid", async (req, res) => {
    const {gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalsub_progress_total(?)", [gid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getgoalcount/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetGoalCount(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getstrategiescount/:in_reg_id/:in_gid/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_gid,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetStrategiesCount(?,?,?)", [in_reg_id,in_gid,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getportfolio2/:c_id", async (req, res) => {
    const {c_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetPortfolio2(?)", [c_id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goaldetailaccepted/:in_gmember/:in_gid", async (req, res) => {
    const {in_gmember,in_gid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalDetailAccepted(?,?)", [in_gmember,in_gid]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/gettasksdetail/:in_tid", async (req, res) => {
    const {in_tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetTasksDetail(?)", [in_tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/get-task-details/:in_tid", async (req, res) => {
    const {in_tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itget_task_details(?)", [in_tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getprojectbyid/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetProjectById(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getprojectbyid2/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetProjectById2(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/check-donesubtask/:stid", async (req, res) => {
    const {stid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_Donesubtask(?)", [stid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/gettaskallsubtasknotfile/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetTaskAllSubtaskNotFile(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/itcheck_donetask/:tid", async (req, res) => {
    const {tid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itcheck_Donetask(?)", [tid]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getprojectalltasknotarc/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetProjectAllTaskNotArc(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getprojectallsubtasknotarc/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetProjectAllSubtaskNotArc(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/gettaskallsubtasknotfile/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itgetTaskAllSubtaskNotFile(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategy-tasks/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategy_tasks(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategy-subtasks/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategy_subtasks(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goal-tasks/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoal_tasks(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goal-subtasks/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoal_subtasks(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategydetail/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategyDetail(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goaldetail/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalDetail(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/projectdetail2/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectDetail2(?)", [id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/projectdetail/:in_pid/:in_reg_id", async (req, res) => {
    const {in_pid,in_reg_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectDetail(?,?)", [in_pid,in_reg_id]);
    res.status(200).json(rows[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/gettaskallsubtasknotfile/:id", async (req, res) => {
    const {id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL getTaskAllSubtaskNotFile(?)", [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goalscountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalsCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/acceptedgoalscountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itAcceptedGoalsCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategiescountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategiesCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/acceptedstrategiescountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itAcceptedStrategiesCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/projectcountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/acceptedprojectcountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itAcceptedProjectCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/taskcountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itTaskCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/singletaskcountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSingleTaskCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/subtaskcountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSubtaskCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/singlesubtaskcountdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSingleSubtaskCountDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/goalsdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itGoalsDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/acceptedgoalsdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itAcceptedGoalsDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategiesdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategiesDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/acceptedstrategiesdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itAcceptedStrategiesDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/projectsdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectsDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/acceptedprojectsdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itAcceptedProjectsDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/tasksdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itTasksDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/singletasksdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSingleTasksDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/subtasksdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSubtasksDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/singlesubtasksdeptwise/:in_reg_id/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSingleSubtasksDeptWise(?,?,?)", [in_reg_id,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategiescountgoalwise/:in_gid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_gid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategiesCountGoalWise(?,?,?)", [in_gid,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/strategiesgoalwise/:in_gid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_gid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itStrategiesCountGoalWise(?,?,?)", [in_gid,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/projectscountstrategywise/:in_reg_id/:in_sid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_sid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectsCountStrategyWise(?,?,?,?)", [in_reg_id,in_sid,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/acceptedprojectscountstrategywise/:in_reg_id/:in_sid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_sid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itAcceptedProjectsCountStrategyWise(?,?,?,?)", [in_reg_id,in_sid,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/projectsstrategywise/:in_reg_id/:in_sid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_sid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itProjectsStrategyWise(?,?,?,?)", [in_reg_id,in_sid,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/acceptedprojectsstrategywise/:in_reg_id/:in_sid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_sid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itAcceptedProjectsStrategyWise(?,?,?,?)", [in_reg_id,in_sid,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/taskscountprojectwise/:in_reg_id/:in_pid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_pid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itTasksCountProjectWise(?,?,?,?)", [in_reg_id,in_pid,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/tasksprojectwise/:in_reg_id/:in_pid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_pid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itTasksCountProjectWise(?,?,?,?)", [in_reg_id,in_pid,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/subtaskcounttaskwise/:in_reg_id/:in_tid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_tid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSubtaskCountTaskWise(?,?,?,?)", [in_reg_id,in_tid,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/subtaskstaskwise/:in_reg_id/:in_tid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_tid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSubtaskCountTaskWise(?,?,?,?)", [in_reg_id,in_tid,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/singlesubtaskcounttaskwise/:in_reg_id/:in_tid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_tid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSingleSubtaskCountTaskWise(?,?,?,?)", [in_reg_id,in_tid,in_dept_id,in_portfolio_id]);
    const numRows = rows[0] ? rows[0].length : 0;
    res.status(200).json(numRows);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/singlesubtaskstaskwise/:in_reg_id/:in_tid/:in_dept_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_tid,in_dept_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL file_itSingleSubtaskCountTaskWise(?,?,?,?)", [in_reg_id,in_tid,in_dept_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/getprojectfilesbypid/:pid", async (req, res) => {
    const {pid} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL getProjectfilesbyPid(?)", [pid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/task-5files/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL task_5Files(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/singletask-5files/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL singleTask_5Files(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/subtask-5files/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL subtask_5Files(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/singlesubtask-5files/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL singleSubtask_5Files(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/file-cabinet/file-it/project-5files/:in_reg_id/:in_portfolio_id", async (req, res) => {
    const {in_reg_id,in_portfolio_id} = req.params
  try {
    const [rows, fields] = await pool.execute("CALL project_5Files(?,?)", [in_reg_id,in_portfolio_id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;