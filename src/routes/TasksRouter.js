const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { dateConversion } = require("../utils/common-functions");
const moment = require("moment");

// Get All Archive Modules
router.get("/archive/:portfolio_id/:user_id", async (req, res) => {
    const { portfolio_id, user_id } = req.params;
    try {
      const [archive_goals] = await pool.execute("CALL ArchiveGoals(?,?)", [user_id, portfolio_id]);
      const [archive_kpis] = await pool.execute("CALL ArchiveStrategies(?,?)", [user_id, portfolio_id]);
      const [archive_projects] = await pool.execute("CALL ArchiveProjects(?,?)", [portfolio_id, user_id]);
      const [archive_tasks] = await pool.execute("CALL ArchiveTasks(?,?)", [user_id, portfolio_id]);
      const [archive_single_tasks] = await pool.execute("CALL ArchiveSingleTasks(?,?)", [user_id, portfolio_id]);
      const [archive_subtasks] = await pool.execute("CALL ArchiveSubtasks(?,?)", [portfolio_id, user_id]);
      const [archive_single_subtasks] = await pool.execute("CALL ArchiveSingleSubtasks(?,?)", [portfolio_id, user_id]);
      res.status(200).json({
        archiveGoals: archive_goals[0],
        archiveKpis: archive_kpis[0],
        archiveProjects: archive_projects[0],
        archiveTasks: archive_tasks[0],
        archiveSingleTasks: archive_single_tasks[0],
        archiveSubtasks: archive_subtasks[0],
        archiveSingleSubtasks: archive_single_subtasks[0],
      });
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

module.exports = router;