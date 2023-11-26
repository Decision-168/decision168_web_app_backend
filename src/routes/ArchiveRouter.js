const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { dateConversion } = require("../utils/common-functions");
const moment = require("moment");

// Get All Archive Modules
router.get("/archive/data/:portfolio_id/:user_id", async (req, res) => {
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

//  Get User Detail by ID
router.get("/archive/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [user_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    res.status(200).json(user_row[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Archive Portfolio
router.patch("/archive/portfolio/:portf_id/:user_id", async (req, res) => {
  const { portf_id, user_id } = req.params;
  try {
    const [portfolio_row] = await pool.execute("CALL getPortfolioNotArc(?,?)", [
      portf_id,
      user_id,
    ]);
    const [goal_row] = await pool.execute("CALL portfolio_goalsTrash(?)", [
      portf_id,
    ]);
    const [kpi_row] = await pool.execute(
      "CALL portfolio_strategiesTrash(?)",
      [portf_id]
    );
    const [project_row] = await pool.execute(
      "CALL portfolio_projectsNotArc(?)",
      [portf_id]
    );
    const [task_row] = await pool.execute(
      "CALL getPortfolioAllTaskNotArc(?)",
      [portf_id]
    );
    const [subtask_row] = await pool.execute(
      "CALL getPortfolioAllSubtaskNotArc(?)",
      [portf_id]
    );

    const [portfolio_wise_tasks] = await pool.execute(
      "CALL file_itPortfolioprogress_total(?)",
      [portf_id]
    );
    const [portfolio_wise_done_tasks] = await pool.execute(
      "CALL file_itPortfolioprogress_done(?)",
      [portf_id]
    );

    const [portfolio_wise_subtasks] = await pool.execute(
      "CALL file_itPortfoliosub_progress_total(?)",
      [portf_id]
    );
    const [portfolio_wise_done_subtasks] = await pool.execute(
      "CALL file_itPortfoliosub_progress_done(?)",
      [portf_id]
    );

    const formattedDate = dateConversion();
    const portfolioFieldsValues = `portfolio_archive = 'yes', portfolio_archive_date = '${formattedDate}'`;
    const portfolio_id = `portfolio_id = '${portf_id}'`;

    if (portfolio_row[0][0]) {
      const all_task = portfolio_wise_tasks[0][0].count_rows;
      const done_task = portfolio_wise_done_tasks[0][0].count_rows;
      const all_subtask = portfolio_wise_subtasks[0][0].count_rows;
      const done_subtask = portfolio_wise_done_subtasks[0][0].count_rows;

      const total_all = all_task + all_subtask;
      const total_done = done_task + done_subtask;
      if (total_all == total_done) {
        await pool.execute("CALL UpdatePortfolio(?,?)", [
          portfolioFieldsValues,
          portfolio_id,
        ]);
        await pool.execute("CALL UpdatePortfolioMember(?,?)", [
          portfolioFieldsValues,
          portfolio_id,
        ]);

        if (goal_row[0]) {
          const goalFieldsValues = `g_archive = 'yes', g_archive_date = '${formattedDate}'`;
          await pool.execute("CALL UpdateGoals(?,?)", [
            goalFieldsValues,
            portfolio_id,
          ]);
          if (goal_row[0]) {
            const goal_array = goal_row[0];
            goal_array.forEach(async (row) => {
              const gid = `gid = '${row.gid}'`;
              await pool.execute("CALL UpdateGoalsInvitedMembers(?,?)", [
                goalFieldsValues,
                gid,
              ]);
              await pool.execute("CALL UpdateGoalsMembers(?,?)", [
                goalFieldsValues,
                gid,
              ]);
              await pool.execute("CALL UpdateGoalsSuggestedMembers(?,?)", [
                goalFieldsValues,
                gid,
              ]);
            });
          }
        }

        if (kpi_row[0]) {
          const kpiFieldsValues = `s_archive = 'yes', s_archive_date = '${formattedDate}'`;
          await pool.execute("CALL UpdateStrategies(?,?)", [
            kpiFieldsValues,
            portfolio_id,
          ]);
        }

        if (project_row[0]) {
          const projectFieldsValues = `project_archive = 'yes', project_archive_date = '${formattedDate}'`;
          await pool.execute("CALL UpdateProject(?,?)", [
            projectFieldsValues,
            portfolio_id,
          ]);
          if (project_row[0]) {
            const project_array = project_row[0];
            project_array.forEach(async (row) => {
              const pid = `pid = '${row.pid}'`;
              await pool.execute("CALL UpdateProjectFiles(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectManagement(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectManagementFields(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectMembers(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [
                projectFieldsValues,
                pid,
              ]);
            });
          }
        }

        if (task_row[0]) {
          const taskFieldsValues = `task_archive = 'yes', task_archive_date = '${formattedDate}'`;
          await pool.execute("CALL UpdateTask(?,?)", [
            taskFieldsValues,
            portfolio_id,
          ]);
        }

        if (subtask_row[0]) {
          const subtaskFieldsValues = `subtask_archive = 'yes', subtask_archive_date = '${formattedDate}'`;
          await pool.execute("CALL UpdateSubtask(?,?)", [
            subtaskFieldsValues,
            portfolio_id,
          ]);
        }
        return res
          .status(200)
          .json({ message: "Portfolio Archived Successfully." });
      } else {
        return res.status(400).json({
          error:
            "Please Complete All Tasks and Subtasks to Archive the Portfolio!",
        });
      }
    } else {
      res.status(400).json({ error: "Failed to get Portfolio details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Archive Goal
router.patch("/archive/goal/:goal_id/:user_id", async (req, res) => {
  const { goal_id, user_id } = req.params;
  try {
    const [goal_row] = await pool.execute("CALL archiveGoalDetail(?)", [
      goal_id,
    ]);

    const [goal_wise_tasks] = await pool.execute(
      "CALL file_itGoalprogress_total(?)",
      [goal_id]
    );
    const [goal_wise_done_tasks] = await pool.execute(
      "CALL file_itGoalprogress_done(?)",
      [goal_id]
    );

    const [goal_wise_subtasks] = await pool.execute(
      "CALL file_itGoalsub_progress_total(?)",
      [goal_id]
    );
    const [goal_wise_done_subtasks] = await pool.execute(
      "CALL file_itGoalsub_progress_done(?)",
      [goal_id]
    );

    const formattedDate = dateConversion();
    const goalFieldsValues = `g_archive = 'yes', g_archive_date = '${formattedDate}'`;
    const gid = `gid = '${goal_id}'`;

    if (goal_row[0][0]) {
      const all_task = goal_wise_tasks[0][0].count_rows;
      const done_task = goal_wise_done_tasks[0][0].count_rows;
      const all_subtask = goal_wise_subtasks[0][0].count_rows;
      const done_subtask = goal_wise_done_subtasks[0][0].count_rows;

      const total_all = all_task + all_subtask;
      const total_done = done_task + done_subtask;
      if (total_all == total_done) {
        await pool.execute("CALL UpdateGoals(?,?)", [goalFieldsValues, gid]);
        await pool.execute("CALL UpdateGoalsInvitedMembers(?,?)", [
          goalFieldsValues,
          gid,
        ]);
        await pool.execute("CALL UpdateGoalsMembers(?,?)", [
          goalFieldsValues,
          gid,
        ]);
        await pool.execute("CALL UpdateGoalsSuggestedMembers(?,?)", [
          goalFieldsValues,
          gid,
        ]);

        const [goal_wise_kpis] = await pool.execute(
          "CALL GoalsAllStrategiesList_to_delete(?)",
          [goal_id]
        );
        if (goal_wise_kpis[0]) {
          const kpi_array = goal_wise_kpis[0];
          kpi_array.forEach(async (row) => {
            const kpiFieldsValues = `s_archive = 'yes', s_archive_date = '${formattedDate}'`;
            const sid = `sid = '${row.sid}'`;
            await pool.execute("CALL UpdateStrategies(?,?)", [
              kpiFieldsValues,
              sid,
            ]);
            const [kpi_wise_projects] = await pool.execute(
              "CALL StrategyAllProjectsList_to_delete(?)",
              [row.sid]
            );
            if (kpi_wise_projects[0]) {
              const project_array = kpi_wise_projects[0];
              project_array.forEach(async (row) => {
                const projectFieldsValues = `project_archive = 'yes', project_archive_date = '${formattedDate}'`;
                const pid = `pid = '${row.pid}'`;
                await pool.execute("CALL UpdateProject(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectFiles(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectManagement(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectManagementFields(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);

                const taskFieldsValues = `task_archive = 'yes', task_archive_date = '${formattedDate}'`;
                const tproject_assign = `tproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateTask(?,?)", [
                  taskFieldsValues,
                  tproject_assign,
                ]);

                const subtaskFieldsValues = `subtask_archive = 'yes', subtask_archive_date = '${formattedDate}'`;
                const stproject_assign = `stproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateSubtask(?,?)", [
                  subtaskFieldsValues,
                  stproject_assign,
                ]);
              });
            }
          });
        }
        const [owner_row] = await pool.execute("CALL getStudentById(?)", [
          user_id,
        ]);
        const student = owner_row[0][0];

        const historyFieldsNames =
          "gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${goal_id}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Goal Archived By Goal Owner ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [
          historyFieldsNames,
          historyFieldsValues,
        ]);
        return res.status(200).json({ message: "Goal Archived Successfully." });
      } else {
        return res.status(400).json({
          error: "Please Complete All Tasks and Subtasks to Archive the Goal!",
        });
      }
    } else {
      res.status(400).json({ error: "Failed to get Goal details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Archive KPI
router.patch("/archive/kpi/:strategy_id/:user_id", async (req, res) => {
  const { strategy_id, user_id } = req.params;
  try {
    const [kpi_row] = await pool.execute("CALL archiveStrategyDetail(?)", [
      strategy_id,
    ]);

    const [kpi_wise_tasks] = await pool.execute(
      "CALL file_itStrategyprogress_total(?)",
      [strategy_id]
    );
    const [kpi_wise_done_tasks] = await pool.execute(
      "CALL file_itStrategyprogress_done(?)",
      [strategy_id]
    );

    const [kpi_wise_subtasks] = await pool.execute(
      "CALL file_itStrategysub_progress_total(?)",
      [strategy_id]
    );
    const [kpi_wise_done_subtasks] = await pool.execute(
      "CALL file_itStrategysub_progress_done(?)",
      [strategy_id]
    );
    const formattedDate = dateConversion();
    if (kpi_row[0][0]) {
      const all_task = kpi_wise_tasks[0][0].count_rows;
      const done_task = kpi_wise_done_tasks[0][0].count_rows;
      const all_subtask = kpi_wise_subtasks[0][0].count_rows;
      const done_subtask = kpi_wise_done_subtasks[0][0].count_rows;

      const total_all = all_task + all_subtask;
      const total_done = done_task + done_subtask;
      if (total_all == total_done) {
        const kpiFieldsValues = `s_archive = 'yes', s_archive_date = '${formattedDate}'`;
        const sid = `sid = '${strategy_id}'`;
        await pool.execute("CALL UpdateStrategies(?,?)", [
          kpiFieldsValues,
          sid,
        ]);
        const [kpi_wise_projects] = await pool.execute(
          "CALL StrategyAllProjectsList_to_delete(?)",
          [strategy_id]
        );
        if (kpi_wise_projects[0]) {
          const project_array = kpi_wise_projects[0];
          project_array.forEach(async (row) => {
            const projectFieldsValues = `project_archive = 'yes', project_archive_date = '${formattedDate}'`;
            const pid = `pid = '${row.pid}'`;
            await pool.execute("CALL UpdateProject(?,?)", [
              projectFieldsValues,
              pid,
            ]);
            await pool.execute("CALL UpdateProjectFiles(?,?)", [
              projectFieldsValues,
              pid,
            ]);
            await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [
              projectFieldsValues,
              pid,
            ]);
            await pool.execute("CALL UpdateProjectManagement(?,?)", [
              projectFieldsValues,
              pid,
            ]);
            await pool.execute("CALL UpdateProjectManagementFields(?,?)", [
              projectFieldsValues,
              pid,
            ]);
            await pool.execute("CALL UpdateProjectMembers(?,?)", [
              projectFieldsValues,
              pid,
            ]);
            await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [
              projectFieldsValues,
              pid,
            ]);

            const taskFieldsValues = `task_archive = 'yes', task_archive_date = '${formattedDate}'`;
            const tproject_assign = `tproject_assign = '${row.pid}'`;
            await pool.execute("CALL UpdateTask(?,?)", [
              taskFieldsValues,
              tproject_assign,
            ]);

            const subtaskFieldsValues = `subtask_archive = 'yes', subtask_archive_date = '${formattedDate}'`;
            const stproject_assign = `stproject_assign = '${row.pid}'`;
            await pool.execute("CALL UpdateSubtask(?,?)", [
              subtaskFieldsValues,
              stproject_assign,
            ]);
          });
        }
        const [owner_row] = await pool.execute("CALL getStudentById(?)", [
          user_id,
        ]);
        const student = owner_row[0][0];

        const historyFieldsNames =
          "sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${strategy_id}", "${kpi_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "KPI Archived By KPI Owner ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [
          historyFieldsNames,
          historyFieldsValues,
        ]);
        return res.status(200).json({ message: "KPI Archived Successfully." });
      } else {
        return res.status(400).json({
          error: "Please Complete All Tasks and Subtasks to Archive the KPI!",
        });
      }
    } else {
      res.status(400).json({ error: "Failed to get KPI details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Archive Project
router.patch("/archive/project/:project_id/:user_id", async (req, res) => {
  const { project_id, user_id } = req.params;
  try {
    const [project_row] = await pool.execute("CALL archiveProjectDetail(?,?)", [
      user_id,
      project_id,
    ]);

    const [project_wise_tasks] = await pool.execute(
      "CALL file_itprogress_total(?)",
      [project_id]
    );
    const [project_wise_done_tasks] = await pool.execute(
      "CALL file_itprogress_done(?)",
      [project_id]
    );

    const [project_wise_subtasks] = await pool.execute(
      "CALL file_itsub_progress_total(?)",
      [project_id]
    );
    const [project_wise_done_subtasks] = await pool.execute(
      "CALL file_itsub_progress_done(?)",
      [project_id]
    );
    const formattedDate = dateConversion();
    if (project_row[0][0]) {
      const all_task = project_wise_tasks[0][0].count_rows;
      const done_task = project_wise_done_tasks[0][0].count_rows;
      const all_subtask = project_wise_subtasks[0][0].count_rows;
      const done_subtask = project_wise_done_subtasks[0][0].count_rows;

      const total_all = all_task + all_subtask;
      const total_done = done_task + done_subtask;
      if (total_all == total_done) {
        const projectFieldsValues = `project_archive = 'yes', project_archive_date = '${formattedDate}'`;
        const pid = `pid = '${project_id}'`;
        await pool.execute("CALL UpdateProject(?,?)", [
          projectFieldsValues,
          pid,
        ]);
        await pool.execute("CALL UpdateProjectFiles(?,?)", [
          projectFieldsValues,
          pid,
        ]);
        await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [
          projectFieldsValues,
          pid,
        ]);
        await pool.execute("CALL UpdateProjectManagement(?,?)", [
          projectFieldsValues,
          pid,
        ]);
        await pool.execute("CALL UpdateProjectManagementFields(?,?)", [
          projectFieldsValues,
          pid,
        ]);
        await pool.execute("CALL UpdateProjectMembers(?,?)", [
          projectFieldsValues,
          pid,
        ]);
        await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [
          projectFieldsValues,
          pid,
        ]);

        const taskFieldsValues = `task_archive = 'yes', task_archive_date = '${formattedDate}'`;
        const tproject_assign = `tproject_assign = '${project_id}'`;
        await pool.execute("CALL UpdateTask(?,?)", [
          taskFieldsValues,
          tproject_assign,
        ]);

        const subtaskFieldsValues = `subtask_archive = 'yes', subtask_archive_date = '${formattedDate}'`;
        const stproject_assign = `stproject_assign = '${project_id}'`;
        await pool.execute("CALL UpdateSubtask(?,?)", [
          subtaskFieldsValues,
          stproject_assign,
        ]);
        const [owner_row] = await pool.execute("CALL getStudentById(?)", [
          user_id,
        ]);
        const student = owner_row[0][0];

        const historyFieldsNames =
          "pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Project Archived By Project Owner ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [
          historyFieldsNames,
          historyFieldsValues,
        ]);
        return res
          .status(200)
          .json({ message: "Project Archived Successfully." });
      } else {
        return res.status(400).json({
          error:
            "Please Complete All Tasks and Subtasks to Archive the Project!",
        });
      }
    } else {
      res.status(400).json({ error: "Failed to get Project details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Archive Task
router.patch("/archive/task/:task_id/:user_id", async (req, res) => {
  const { task_id, user_id } = req.params;
  try {
    const [task_row] = await pool.execute("CALL archivecheck_Donetask(?)", [
      task_id,
    ]);

    const [subtasks] = await pool.execute(
      "CALL file_itTasksubtask_progress_total(?)",
      [task_id]
    );
    const [done_subtasks] = await pool.execute(
      "CALL file_itTasksubtask_progress_done(?)",
      [task_id]
    );
    const formattedDate = dateConversion();
    if (task_row[0][0]) {
      const all_subtask = subtasks[0][0].count_rows;
      const done_subtask = done_subtasks[0][0].count_rows;
      if (all_subtask == done_subtask) {
        const taskFieldsValues = `task_archive = 'yes', task_archive_date = '${formattedDate}'`;
        const tid = `tid = '${task_id}'`;
        await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tid]);

        const subtaskFieldsValues = `subtask_archive = 'yes', subtask_archive_date = '${formattedDate}'`;
        await pool.execute("CALL UpdateSubtask(?,?)", [
          subtaskFieldsValues,
          tid,
        ]);
        const [owner_row] = await pool.execute("CALL getStudentById(?)", [
          user_id,
        ]);
        const student = owner_row[0][0];

        const historyFieldsNames =
          "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_row[0][0].tcode} Task Archived By ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [
          historyFieldsNames,
          historyFieldsValues,
        ]);
        return res.status(200).json({ message: "Task Archived Successfully." });
      } else {
        return res.status(400).json({
          error: "Please Complete All Subtasks to Archive the Task.",
        });
      }
    } else {
      res.status(400).json({ error: "Please Complete Task to file it." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Archive Subtask
router.patch("/archive/subtask/:subtask_id/:user_id", async (req, res) => {
  const { subtask_id, user_id } = req.params;
  try {
    const [subtask_row] = await pool.execute(
      "CALL archivecheck_Donesubtask(?)",
      [subtask_id]
    );
    const formattedDate = dateConversion();
    if (subtask_row[0][0]) {
      const subtaskFieldsValues = `subtask_archive = 'yes', subtask_archive_date = '${formattedDate}'`;
      const stid = `stid = '${subtask_id}'`;
      await pool.execute("CALL UpdateSubtask(?,?)", [
        subtaskFieldsValues,
        stid,
      ]);
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const student = owner_row[0][0];

      const historyFieldsNames =
        "subtask_id, task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].tid}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_row[0][0].stcode} Subtask Archived By ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [
        historyFieldsNames,
        historyFieldsValues,
      ]);
      return res
        .status(200)
        .json({ message: "Subtask Archived Successfully." });
    } else {
      res.status(400).json({ error: "Please Complete Subtask to file it." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Portfolio
router.patch(
  "/archive/reopen/portfolio/:portfolio_id/:user_id",
  async (req, res) => {
    const { portfolio_id, user_id } = req.params;
    try {
      var limitation = "";
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const student = owner_row[0][0];
      const formattedDate = dateConversion();
      const format = "Y-MM-DD H:m:s";
      if (moment(student.package_expiry, format, true).isValid()) {
        const expiryDate = new Date(student.package_expiry);
        const currentDate = new Date();
        if (expiryDate <= currentDate) {
          res.status(400).json({ error: "Package Expired." });
        } else {
          const [package] = await pool.execute("CALL getPackDetail(?)", [
            student.package_id,
          ]);
          const [portfolio_count] = await pool.execute(
            "CALL getPortfolioCount(?)",
            [user_id]
          );
          if (package[0][0]) {
            const total_portfolios = package[0][0].pack_portfolios;
            const used_portfolios = portfolio_count[0][0].portfolio_count_rows;
            const check_type = !isNaN(total_portfolios);
            if (check_type) {
              if (used_portfolios < total_portfolios) {
                if (portfolio_id) {
                  var limitation = "in_limit";
                }
              } else {
                res.status(400).json({ error: "Limit Exceeds." });
              }
            } else {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            }
          } else {
            res.status(400).json({ error: "Package Expired." });
          }
        }
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [
          student.package_id,
        ]);
        const [portfolio_count] = await pool.execute(
          "CALL getPortfolioCount(?)",
          [user_id]
        );
        if (package[0][0]) {
          const total_portfolios = package[0][0].pack_portfolios;
          const used_portfolios = portfolio_count[0][0].portfolio_count_rows;
          const check_type = !isNaN(total_portfolios);
          if (check_type) {
            if (used_portfolios < total_portfolios) {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }
      if (limitation == "in_limit") {
        const [portfolio_row] = await pool.execute(
          "CALL getPortfolioNotArc(?,?)",
          [portfolio_id, user_id]
        );
        const [goal_row] = await pool.execute(
          "CALL portfolio_goalsTrash(?)",
          [portfolio_id]
        );
        const [kpi_row] = await pool.execute(
          "CALL portfolio_strategiesTrash(?)",
          [portfolio_id]
        );
        const [project_row] = await pool.execute(
          "CALL portfolio_projectsNotArc(?)",
          [portfolio_id]
        );

        if (portfolio_row[0][0]) {
          const portfolioFieldsValues = `portfolio_archive = '', portfolio_archive_date = '', portfolio_file_it = '', portfolio_file_it_date = ''`;
          const portfolio_id = `portfolio_id = '${portfolio_id}'`;
          await pool.execute("CALL UpdatePortfolio(?,?)", [
            portfolioFieldsValues,
            portfolio_id,
          ]);
          await pool.execute("CALL UpdatePortfolioMember(?,?)", [
            portfolioFieldsValues,
            portfolio_id,
          ]);

          if (goal_row[0]) {
            const goalFieldsValues = `g_archive = '', g_archive_date = '', g_file_it = '', g_file_it_date = ''`;
            await pool.execute("CALL UpdateGoals(?,?)", [
              goalFieldsValues,
              portfolio_id,
            ]);
            if (goal_row[0]) {
              const goal_array = goal_row[0];
              goal_array.forEach(async (row) => {
                const gid = `gid = '${row.gid}'`;
                await pool.execute("CALL UpdateGoalsInvitedMembers(?,?)", [
                  goalFieldsValues,
                  gid,
                ]);
                await pool.execute("CALL UpdateGoalsMembers(?,?)", [
                  goalFieldsValues,
                  gid,
                ]);
                await pool.execute("CALL UpdateGoalsSuggestedMembers(?,?)", [
                  goalFieldsValues,
                  gid,
                ]);
              });
            }
          }

          if (kpi_row[0]) {
            const kpiFieldsValues = `s_archive = '', s_archive_date = '', s_file_it = '', s_file_it_date = ''`;
            await pool.execute("CALL UpdateStrategies(?,?)", [
              kpiFieldsValues,
              portfolio_id,
            ]);
          }

          if (project_row[0]) {
            const projectFieldsValues = `project_archive = '', project_archive_date = '', project_file_it = '', project_file_it_date = ''`;
            await pool.execute("CALL UpdateProject(?,?)", [
              projectFieldsValues,
              portfolio_id,
            ]);
            if (project_row[0]) {
              const project_array = project_row[0];
              project_array.forEach(async (row) => {
                const pid = `pid = '${row.pid}'`;
                await pool.execute("CALL UpdateProjectFiles(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectManagement(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectManagementFields(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
              });
            }
          }

          const taskFieldsValues = `task_archive = '', task_archive_date = '', task_file_it = '', task_file_it_date = ''`;
          await pool.execute("CALL UpdateTask(?,?)", [
            taskFieldsValues,
            portfolio_id,
          ]);

          const subtaskFieldsValues = `subtask_archive = '', subtask_archive_date = '', subtask_file_it = '', subtask_file_it_date = ''`;
          await pool.execute("CALL UpdateSubtask(?,?)", [
            subtaskFieldsValues,
            portfolio_id,
          ]);

          return res
            .status(200)
            .json({ message: "Portfolio Reopened Successfully." });
        } else {
          res.status(400).json({ error: "Failed to get Portfolio details." });
        }
      } else {
        res.status(400).json({ error: "Limit Exceeds." });
      }
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Reopen Goal
router.patch(
  "/archive/reopen/goal/:goal_id/:portfolio_id/:user_id",
  async (req, res) => {
    const { goal_id, portfolio_id, user_id } = req.params;
    try {
      var limitation = "";
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const student = owner_row[0][0];
      const formattedDate = dateConversion();
      const format = "Y-MM-DD H:m:s";
      if (moment(student.package_expiry, format, true).isValid()) {
        const expiryDate = new Date(student.package_expiry);
        const currentDate = new Date();
        if (expiryDate <= currentDate) {
          res.status(400).json({ error: "Package Expired." });
        } else {
          const [package] = await pool.execute("CALL getPackDetail(?)", [
            student.package_id,
          ]);
          const [goal_count] = await pool.execute("CALL getGoalCount(?,?)", [
            user_id,
            portfolio_id,
          ]);
          if (package[0][0]) {
            const total_goals = package[0][0].pack_goals;
            const used_goals = goal_count[0][0].goal_count_rows;
            const check_type = !isNaN(total_goals);
            if (check_type) {
              if (used_goals < total_goals) {
                if (portfolio_id) {
                  var limitation = "in_limit";
                }
              } else {
                res.status(400).json({ error: "Limit Exceeds." });
              }
            } else {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            }
          } else {
            res.status(400).json({ error: "Package Expired." });
          }
        }
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [
          student.package_id,
        ]);
        const [goal_count] = await pool.execute("CALL getGoalCount(?,?)", [
          user_id,
          portfolio_id,
        ]);
        if (package[0][0]) {
          const total_goals = package[0][0].pack_goals;
          const used_goals = goal_count[0][0].goal_count_rows;
          const check_type = !isNaN(total_goals);
          if (check_type) {
            if (used_goals < total_goals) {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }
      if (limitation == "in_limit") {
        const [goal_row] = await pool.execute("CALL check_goal_archive(?,?)", [
          user_id,
          goal_id,
        ]);

        if (goal_row[0][0]) {
          const [portfolio_row] = await pool.execute(
            "CALL checkProjectPorfolioArchive(?)",
            [goal_row[0][0].portfolio_id]
          );
          if (portfolio_row[0][0]) {
            res.status(400).json({
              error:
                "Portfolio is Archived! To Reopen Goal please Reopen Portfolio.",
            });
          } else {
            const [portfolio_del] = await pool.execute(
              "CALL getPortfolioById(?)",
              [goal_row[0][0].portfolio_id]
            );
            let file_it = '';
            let file_it_date = '';

            if (portfolio_del[0][0]) {
              if (portfolio_del[0][0].portfolio_file_it == "yes") {
                file_it = "yes";
                file_it_date = portfolio_del[0][0].portfolio_file_it_date;
              }
            }
            const goalFieldsValues = `g_archive = '', g_archive_date = '', g_file_it = '${file_it}', g_file_it_date = '${file_it_date}'`;
            const gid = `gid = '${goal_id}'`;
            await pool.execute("CALL UpdateGoals(?,?)", [
              goalFieldsValues,
              gid,
            ]);
            await pool.execute("CALL UpdateGoalsInvitedMembers(?,?)", [
              goalFieldsValues,
              gid,
            ]);
            await pool.execute("CALL UpdateGoalsMembers(?,?)", [
              goalFieldsValues,
              gid,
            ]);
            await pool.execute("CALL UpdateGoalsSuggestedMembers(?,?)", [
              goalFieldsValues,
              gid,
            ]);

            const [goal_wise_kpis] = await pool.execute(
              "CALL GoalsAllStrategiesList_to_delete(?)",
              [goal_id]
            );
            if (goal_wise_kpis[0]) {
              const kpi_array = goal_wise_kpis[0];
              kpi_array.forEach(async (row) => {
                const kpiFieldsValues = `s_archive = '', s_archive_date = '', s_file_it = '${file_it}', s_file_it_date = '${file_it_date}'`;
                const sid = `sid = '${row.sid}'`;
                await pool.execute("CALL UpdateStrategies(?,?)", [
                  kpiFieldsValues,
                  sid,
                ]);

                const [kpi_wise_projects] = await pool.execute(
                  "CALL StrategyAllProjectsList_to_delete(?)",
                  [row.sid]
                );
                if (kpi_wise_projects[0]) {
                  const project_array = kpi_wise_projects[0];
                  project_array.forEach(async (row) => {
                    const projectFieldsValues = `project_archive = '', project_archive_date = '', project_file_it = '${file_it}', project_file_it_date = '${file_it_date}'`;
                    const pid = `pid = '${row.pid}'`;
                    await pool.execute("CALL UpdateProject(?,?)", [
                      projectFieldsValues,
                      pid,
                    ]);
                    await pool.execute("CALL UpdateProjectFiles(?,?)", [
                      projectFieldsValues,
                      pid,
                    ]);
                    await pool.execute(
                      "CALL UpdateProjectInvitedMembers(?,?)",
                      [projectFieldsValues, pid]
                    );
                    await pool.execute("CALL UpdateProjectManagement(?,?)", [
                      projectFieldsValues,
                      pid,
                    ]);
                    await pool.execute(
                      "CALL UpdateProjectManagementFields(?,?)",
                      [projectFieldsValues, pid]
                    );
                    await pool.execute("CALL UpdateProjectMembers(?,?)", [
                      projectFieldsValues,
                      pid,
                    ]);
                    await pool.execute(
                      "CALL UpdateProjectSuggestedMembers(?,?)",
                      [projectFieldsValues, pid]
                    );

                    const taskFieldsValues = `task_archive = '', task_archive_date = '', task_file_it = '${file_it}', task_file_it_date = '${file_it_date}'`;
                    const tproject_assign = `tproject_assign = '${row.pid}'`;
                    await pool.execute("CALL UpdateTask(?,?)", [
                      taskFieldsValues,
                      tproject_assign,
                    ]);

                    const subtaskFieldsValues = `subtask_archive = '', subtask_archive_date = '', subtask_file_it = '${file_it}', subtask_file_it_date = '${file_it_date}'`;
                    const stproject_assign = `stproject_assign = '${row.pid}'`;
                    await pool.execute("CALL UpdateSubtask(?,?)", [
                      subtaskFieldsValues,
                      stproject_assign,
                    ]);
                  });
                }
              });
            }

            const historyFieldsNames =
              "gid, h_date, h_resource_id, h_resource, h_description";
            const historyFieldsValues = `"${goal_id}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Goal Reopened By ${student.first_name} ${student.last_name}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [
              historyFieldsNames,
              historyFieldsValues,
            ]);
            return res
              .status(200)
              .json({ message: "Goal Reopened Successfully." });
          }
        } else {
          res.status(400).json({ error: "Failed to get Goal details." });
        }
      } else {
        res.status(400).json({ error: "Limit Exceeds." });
      }
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Reopen KPI
router.patch(
  "/archive/reopen/kpi/:strategy_id/:portfolio_id/:user_id",
  async (req, res) => {
    const { strategy_id, portfolio_id, user_id } = req.params;
    try {
      var limitation = "";
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const student = owner_row[0][0];
      const [kpi] = await pool.execute("CALL StrategyDetailGid(?)", [
        strategy_id,
      ]);
      const formattedDate = dateConversion();
      const format = "Y-MM-DD H:m:s";
      if (moment(student.package_expiry, format, true).isValid()) {
        const expiryDate = new Date(student.package_expiry);
        const currentDate = new Date();
        if (expiryDate <= currentDate) {
          res.status(400).json({ error: "Package Expired." });
        } else {
          const [package] = await pool.execute("CALL getPackDetail(?)", [
            student.package_id,
          ]);
          const [kpi_count] = await pool.execute(
            "CALL getStrategiesCount(?,?,?)",
            [user_id, kpi[0][0].gid, portfolio_id]
          );
          if (package[0][0]) {
            const total_kpis = package[0][0].pack_goals_strategies;
            const used_kpis = kpi_count[0][0].strategy_count_rows;
            const check_type = !isNaN(total_kpis);
            if (check_type) {
              if (used_kpis < total_kpis) {
                if (portfolio_id) {
                  var limitation = "in_limit";
                }
              } else {
                res.status(400).json({ error: "Limit Exceeds." });
              }
            } else {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            }
          } else {
            res.status(400).json({ error: "Package Expired." });
          }
        }
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [
          student.package_id,
        ]);
        const [kpi_count] = await pool.execute(
          "CALL getStrategiesCount(?,?,?)",
          [user_id, kpi.gid, portfolio_id]
        );
        if (package[0][0]) {
          const total_kpis = package[0][0].pack_goals_strategies;
          const used_kpis = kpi_count[0][0].strategy_count_rows;
          const check_type = !isNaN(total_kpis);
          if (check_type) {
            if (used_kpis < total_kpis) {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }
      if (limitation == "in_limit") {
        const [kpi_row] = await pool.execute(
          "CALL check_strategy_archive(?,?)",
          [user_id, strategy_id]
        );
        if (kpi_row[0][0]) {
          const [goal_row] = await pool.execute(
            "CALL checkStrategyGoalArchive(?)",
            [kpi_row[0][0].gid]
          );
          if (goal_row[0][0]) {
            res.status(400).json({
              error: "Goal is Archived! To Reopen KPI please Reopen Goal.",
            });
          } else {
            const [goal_del] = await pool.execute("CALL getGoalById(?)", [
              kpi_row[0][0].gid,
            ]);
            let file_it = "";
            let file_it_date = "";

            if (goal_del[0][0]) {
              if (goal_del[0][0].g_file_it == "yes") {
                file_it = "yes";
                file_it_date = goal_del[0][0].g_file_it_date;
              }
            }
            const kpiFieldsValues = `s_archive = '', s_archive_date = '', s_file_it = '${file_it}', s_file_it_date = '${file_it_date}'`;
            const sid = `sid = '${strategy_id}'`;
            await pool.execute("CALL UpdateStrategies(?,?)", [
              kpiFieldsValues,
              sid,
            ]);

            const [kpi_wise_projects] = await pool.execute(
              "CALL StrategyAllProjectsList_to_delete(?)",
              [strategy_id]
            );
            if (kpi_wise_projects[0]) {
              const project_array = kpi_wise_projects[0];
              project_array.forEach(async (row) => {
                const projectFieldsValues = `project_archive = '', project_archive_date = '', project_file_it = '${file_it}', project_file_it_date = '${file_it_date}'`;
                const pid = `pid = '${row.pid}'`;
                await pool.execute("CALL UpdateProject(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectFiles(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectManagement(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectManagementFields(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);
                await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [
                  projectFieldsValues,
                  pid,
                ]);

                const taskFieldsValues = `task_archive = '', task_archive_date = '', task_file_it = '${file_it}', task_file_it_date = '${file_it_date}'`;
                const tproject_assign = `tproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateTask(?,?)", [
                  taskFieldsValues,
                  tproject_assign,
                ]);

                const subtaskFieldsValues = `subtask_archive = '', subtask_archive_date = ''`;
                const stproject_assign = `stproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateSubtask(?,?)", [
                  subtaskFieldsValues,
                  stproject_assign,
                ]);
              });
            }

            const historyFieldsNames =
              "sid, gid, h_date, h_resource_id, h_resource, h_description";
            const historyFieldsValues = `"${strategy_id}", "${kpi_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "KPI Reopned By ${student.first_name} ${student.last_name}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [
              historyFieldsNames,
              historyFieldsValues,
            ]);
            return res
              .status(200)
              .json({ message: "KPI Reopened Successfully." });
          }
        } else {
          res.status(400).json({ error: "Failed to get KPI details." });
        }
      } else {
        res.status(400).json({ error: "Limit Exceeds." });
      }
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Reopen Project
router.patch(
  "/archive/reopen/project/:project_id/:portfolio_id/:user_id",
  async (req, res) => {
    const { project_id, portfolio_id, user_id } = req.params;
    try {
      var limitation = "";
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const student = owner_row[0][0];
      const [project] = await pool.execute("CALL getProjectDetailID(?)", [
        project_id,
      ]);
      const formattedDate = dateConversion();
      const format = "Y-MM-DD H:m:s";
      if (project[0][0].ptype == "content") {
        res.status(400).json({ error: "Content Project." });
      } else {
        if (moment(student.package_expiry, format, true).isValid()) {
          const expiryDate = new Date(student.package_expiry);
          const currentDate = new Date();
          if (expiryDate <= currentDate) {
            res.status(400).json({ error: "Package Expired." });
          } else {
            const [package] = await pool.execute("CALL getPackDetail(?)", [
              student.package_id,
            ]);
            const [project_count] = await pool.execute(
              "CALL getProjectCount(?,?)",
              [user_id, portfolio_id]
            );
            if (package[0][0]) {
              const total_projects = package[0][0].pack_projects;
              const used_projects = project_count[0][0].project_count_rows;
              const check_type = !isNaN(total_projects);
              if (check_type) {
                if (used_projects < total_projects) {
                  if (portfolio_id) {
                    var limitation = "in_limit";
                  }
                } else {
                  res.status(400).json({ error: "Limit Exceeds." });
                }
              } else {
                if (portfolio_id) {
                  var limitation = "in_limit";
                }
              }
            } else {
              res.status(400).json({ error: "Package Expired." });
            }
          }
        } else {
          const [package] = await pool.execute("CALL getPackDetail(?)", [
            student.package_id,
          ]);
          const [project_count] = await pool.execute(
            "CALL getProjectCount(?,?)",
            [user_id, portfolio_id]
          );
          if (package[0][0]) {
            const total_projects = package[0][0].pack_projects;
            const used_projects = project_count[0][0].project_count_rows;
            const check_type = !isNaN(total_projects);
            if (check_type) {
              if (used_projects < total_projects) {
                if (portfolio_id) {
                  var limitation = "in_limit";
                }
              } else {
                res.status(400).json({ error: "Limit Exceeds." });
              }
            } else {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            }
          } else {
            res.status(400).json({ error: "Package Expired." });
          }
        }
      }

      if (limitation == "in_limit") {
        const [project_row] = await pool.execute(
          "CALL check_project_archive(?)",
          [project_id]
        );
        if (project_row[0][0]) {
          const [portfolio_row] = await pool.execute(
            "CALL checkProjectPorfolioArchive(?)",
            [project_row[0][0].portfolio_id]
          );
          if (portfolio_row[0][0]) {
            res.status(400).json({
              error:
                "Portfolio is Archived! To Reopen Project please Reopen Portfolio.",
            });
          } else {
            const [kpi_row] = await pool.execute(
              "CALL checkProjectStrategyArchive(?)",
              [project_row[0][0].sid]
            );
            if (kpi_row[0][0]) {
              res.status(400).json({
                error: "KPI is Archived! To Reopen Project please Reopen KPI.",
              });
            } else {
              const [kpi_del] = await pool.execute("CALL getStrategyById(?)", [
                project_row[0][0].sid,
              ]);
              let file_it = "";
              let file_it_date = "";

              if (kpi_del[0][0]) {
                if (kpi_del[0][0].s_file_it == "yes") {
                  file_it = "yes";
                  file_it_date = kpi_del[0][0].s_file_it_date;
                }
              }
              const projectFieldsValues = `project_archive = '', project_archive_date = '', project_file_it = '${file_it}', project_file_it_date = '${file_it_date}'`;
              const pid = `pid = '${project_id}'`;
              await pool.execute("CALL UpdateProject(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectFiles(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectManagement(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectManagementFields(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectMembers(?,?)", [
                projectFieldsValues,
                pid,
              ]);
              await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [
                projectFieldsValues,
                pid,
              ]);

              const taskFieldsValues = `task_archive = '', task_archive_date = '', task_file_it = '${file_it}', task_file_it_date = '${file_it_date}'`;
              const tproject_assign = `tproject_assign = '${project_id}'`;
              await pool.execute("CALL UpdateTask(?,?)", [
                taskFieldsValues,
                tproject_assign,
              ]);

              const subtaskFieldsValues = `subtask_archive = '', subtask_archive_date = '', subtask_file_it = '${file_it}', subtask_file_it_date = '${file_it_date}'`;
              const stproject_assign = `stproject_assign = '${project_id}'`;
              await pool.execute("CALL UpdateSubtask(?,?)", [
                subtaskFieldsValues,
                stproject_assign,
              ]);

              const historyFieldsNames =
                "pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
              const historyFieldsValues = `"${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Project Reopened By ${student.first_name} ${student.last_name}"`;

              await pool.execute("CALL InsertProjectHistory(?,?)", [
                historyFieldsNames,
                historyFieldsValues,
              ]);
              return res
                .status(200)
                .json({ message: "Project Reopened Successfully." });
            }
          }
        } else {
          res.status(400).json({ error: "Failed to get Project details." });
        }
      } else {
        res.status(400).json({ error: "Limit Exceeds." });
      }
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Reopen Task
router.patch(
  "/archive/reopen/task/:task_id/:portfolio_id/:user_id",
  async (req, res) => {
    const { task_id, portfolio_id, user_id } = req.params;
    try {
      var limitation = "";
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const student = owner_row[0][0];
      const formattedDate = dateConversion();
      const format = "Y-MM-DD H:m:s";
      if (moment(student.package_expiry, format, true).isValid()) {
        const expiryDate = new Date(student.package_expiry);
        const currentDate = new Date();
        if (expiryDate <= currentDate) {
          res.status(400).json({ error: "Package Expired." });
        } else {
          const [package] = await pool.execute("CALL getPackDetail(?)", [
            student.package_id,
          ]);
          const [task_count] = await pool.execute("CALL getTaskCount(?,?)", [
            user_id,
            portfolio_id,
          ]);
          if (package[0][0]) {
            const total_tasks = package[0][0].pack_tasks;
            const used_tasks = task_count[0][0].task_count_rows;
            const check_type = !isNaN(total_tasks);
            if (check_type) {
              const total_all_pro = package[0][0].pack_projects;
              var total_all_task = total_tasks;
              if (!isNaN(total_all_pro)) {
                var total_all_task = total_tasks * total_all_pro;
              }
              if (used_tasks < total_all_task) {
                var limitation = "in_limit";
              } else {
                res.status(400).json({ error: "Limit Exceeds." });
              }
            } else {
              if (portfolio_id) {
                var limitation = "in_limit";
              }
            }
          } else {
            res.status(400).json({ error: "Package Expired." });
          }
        }
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [
          student.package_id,
        ]);
        const [task_count] = await pool.execute("CALL getTaskCount(?,?)", [
          user_id,
          portfolio_id,
        ]);
        if (package[0][0]) {
          const total_tasks = package[0][0].pack_tasks;
          const used_tasks = task_count[0][0].task_count_rows;
          const check_type = !isNaN(total_tasks);
          if (check_type) {
            const total_all_pro = package[0][0].pack_projects;
            var total_all_task = total_tasks;
            if (!isNaN(total_all_pro)) {
              var total_all_task = total_tasks * total_all_pro;
            }
            if (used_tasks < total_all_task) {
              var limitation = "in_limit";
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portfolio_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }

      if (limitation == "in_limit") {
        const [task_row] = await pool.execute("CALL check_task_archive(?)", [
          task_id,
        ]);
        if (task_row[0][0]) {
          const [project_row] = await pool.execute(
            "CALL checkTaskProjectArchive(?)",
            [task_row[0][0].tproject_assign]
          );
          if (project_row[0][0]) {
            res.status(400).json({
              error:
                "Project is Archived! To Reopen Task please Reopen Project.",
            });
          } else {
            const [project_del] = await pool.execute(
              "CALL getPortProjectById(?)",
              [task_row[0][0].tproject_assign]
            );
            let file_it = "";
            let file_it_date = "";

            if (project_del[0][0]) {
              if (project_del[0][0].project_file_it == "yes") {
                file_it = "yes";
                file_it_date = project_del[0][0].project_file_it_date;
              }
            }
            const taskFieldsValues = `task_archive = '', task_archive_date = '', task_file_it = '${file_it}', task_file_it_date = '${file_it_date}'`;
            const tid = `tid = '${task_id}'`;
            await pool.execute("CALL UpdateTask(?,?)", [
              taskFieldsValues,
              tid,
            ]);

            const subtaskFieldsValues = `subtask_archive = '', subtask_archive_date = '', subtask_file_it = '${file_it}', subtask_file_it_date = '${file_it_date}'`;
            await pool.execute("CALL UpdateSubtask(?,?)", [
              subtaskFieldsValues,
              tid,
            ]);

            const historyFieldsNames =
              "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
            const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_row[0][0].tcode} Task Reopened By ${student.first_name} ${student.last_name}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [
              historyFieldsNames,
              historyFieldsValues,
            ]);
            return res
              .status(200)
              .json({ message: "Task Reopened Successfully." });
          }
        } else {
          res.status(400).json({ error: "Failed to get Task details." });
        }
      } else {
        res.status(400).json({ error: "Limit Exceeds." });
      }
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Reopen Subtask
router.patch(
  "/archive/reopen/subtask/:subtask_id/:user_id",
  async (req, res) => {
    const { subtask_id, user_id } = req.params;
    try {
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const student = owner_row[0][0];
      const formattedDate = dateConversion();
      const [subtask_row] = await pool.execute(
        "CALL check_subtask_archive(?)",
        [subtask_id]
      );
      if (subtask_row[0][0]) {
        const [task_row] = await pool.execute(
          "CALL checkSubtaskTaskArchive(?)",
          [subtask_row[0][0].tid]
        );
        if (task_row[0][0]) {
          res.status(400).json({
            error: "Task is Archived! To Reopen Subtask please Reopen Task.",
          });
        } else {
          const [task_del] = await pool.execute("CALL getProjTaskById(?)", [
            subtask_row[0][0].tid,
          ]);
          let file_it = "";
          let file_it_date = "";

          if (task_del[0][0]) {
            if (task_del[0][0].task_file_it == "yes") {
              file_it = "yes";
              file_it_date = task_del[0][0].task_file_it_date;
            }
          }
          const subtaskFieldsValues = `subtask_archive = '', subtask_archive_date = '', subtask_file_it = '${file_it}', subtask_file_it_date = '${file_it_date}'`;
          const stid = `stid = '${subtask_id}'`;
          await pool.execute("CALL UpdateSubtask(?,?)", [
            subtaskFieldsValues,
            stid,
          ]);

          const historyFieldsNames =
            "subtask_id, task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].tid}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_row[0][0].stcode} Subtask Reopened By ${student.first_name} ${student.last_name}"`;

          await pool.execute("CALL InsertProjectHistory(?,?)", [
            historyFieldsNames,
            historyFieldsValues,
          ]);
          return res
            .status(200)
            .json({ message: "Subtask Reopened Successfully." });
        }
      } else {
        res.status(400).json({ error: "Failed to get Subtask details." });
      }
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Goal Details
router.get("/archive/goal-detail/:gid", async (req, res) => {
  const { gid } = req.params;
  try {
    const [goal_detail] = await pool.execute("CALL file_itGoalDetail(?)", [
      gid,
    ]);
    res.status(200).json(goal_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Kpi Details
router.get("/archive/kpi-detail/:sid", async (req, res) => {
  const { sid } = req.params;
  try {
    const [kpi_detail] = await pool.execute("CALL file_itStrategyDetail(?)", [
      sid,
    ]);
    res.status(200).json(kpi_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Project Details
router.get("/archive/project-detail/:pid", async (req, res) => {
  const { pid } = req.params;
  try {
    const [project_detail] = await pool.execute(
      "CALL file_itProjectDetailPortfolio(?)",
      [pid]
    );
    res.status(200).json(project_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Project files Details
router.get("/archive/project-files-detail/:pfile_id", async (req, res) => {
  const { pfile_id } = req.params;
  try {
    const [project_files_detail] = await pool.execute(
      "CALL pfile_detailfile_it(?)",
      [pfile_id]
    );
    res.status(200).json(project_files_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Task Details
router.get("/archive/task-detail/:tid", async (req, res) => {
  const { tid } = req.params;
  try {
    const [task_detail] = await pool.execute("CALL file_itgetTaskById(?)", [
      tid,
    ]);
    res.status(200).json(task_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Subtask Details
router.get("/archive/subtask-detail/:stid", async (req, res) => {
  const { stid } = req.params;
  try {
    const [subtask_detail] = await pool.execute(
      "CALL file_itcheck_subtask(?)",
      [stid]
    );
    res.status(200).json(subtask_detail[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;