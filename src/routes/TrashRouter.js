const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { dateConversion } = require("../utils/common-functions");
const moment = require("moment");

// Get All Trash Modules
router.get("/trash/data/:portfolio_id/:user_id", async (req, res) => {
  const { portfolio_id, user_id } = req.params;
  try {
    const [TrashProjectFiles] = await pool.execute(
      "CALL TrashProjectFiles(?)",
      [portfolio_id]
    );
    const [TrashTaskFiles] = await pool.execute("CALL TrashTaskFiles(?)", [
      portfolio_id,
    ]);
    const [TrashProjects] = await pool.execute("CALL TrashProjects(?,?)", [
      portfolio_id,
      user_id,
    ]);
    const [TrashTasks] = await pool.execute("CALL TrashTasks(?,?)", [
      user_id,
      portfolio_id,
    ]);
    const [TrashSingleTasks] = await pool.execute(
      "CALL TrashSingleTasks(?,?)",
      [user_id, portfolio_id]
    );
    const [TrashSubtasks] = await pool.execute("CALL TrashSubtasks(?,?)", [
      portfolio_id,
      user_id,
    ]);
    const [TrashSingleSubtasks] = await pool.execute(
      "CALL TrashSingleSubtasks(?,?)",
      [portfolio_id, user_id]
    );
    const [TrashSubtaskFiles] = await pool.execute(
      "CALL TrashSubtaskFiles(?)",
      [portfolio_id]
    );
    const [TrashGoals] = await pool.execute("CALL TrashGoals(?,?)", [
      user_id,
      portfolio_id,
    ]);
    const [TrashStrategies] = await pool.execute("CALL TrashStrategies(?,?)", [
      user_id,
      portfolio_id,
    ]);
    res.status(200).json({
      trashProjectFiles: TrashProjectFiles[0],
      trashTaskFiles: TrashTaskFiles[0],
      trashProjects: TrashProjects[0],
      trashTasks: TrashTasks[0],
      trashSingleTasks: TrashSingleTasks[0],
      trashSubtasks: TrashSubtasks[0],
      trashSingleSubtasks: TrashSingleSubtasks[0],
      trashSubtaskFiles: TrashSubtaskFiles[0],
      trashGoals: TrashGoals[0],
      trashStrategies: TrashStrategies[0],
    });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Get User Detail by ID
router.get("/trash/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [user_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    res.status(200).json(user_row[0][0]);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Portfolio
router.patch("/trash/delete/portfolio/:portf_id/:user_id", async (req, res) => {
  const { portf_id, user_id } = req.params;
  try {
    const [portfolio_row] = await pool.execute("CALL getPortfolio(?,?)", [
      portf_id,
      user_id,
    ]);
    const [goal_row] = await pool.execute("CALL portfolio_goalsTrash(?)", [
      portf_id,
    ]);
    const [kpi_row] = await pool.execute("CALL portfolio_strategiesTrash(?)", [
      portf_id,
    ]);
    const [project_row] = await pool.execute(
      "CALL portfolio_projectsTrash(?)",
      [portf_id]
    );
    const [task_row] = await pool.execute("CALL getPortfolioAllTaskTrash(?)", [
      portf_id,
    ]);
    const [subtask_row] = await pool.execute(
      "CALL getPortfolioAllSubtaskTrash(?)",
      [portf_id]
    );

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    const portfolioFieldsValues = `portfolio_trash = 'yes', portfolio_trash_date = '${formattedDate}', delete_agree = 'yes'`;
    const portfolio_id = `portfolio_id = '${portf_id}'`;

    if (portfolio_row[0][0]) {
      await pool.execute("CALL UpdatePortfolio(?,?)", [
        portfolioFieldsValues,
        portfolio_id,
      ]);

      if (goal_row[0]) {
        const goalFieldsValues = `g_trash = 'yes', g_trash_date = '${formattedDate}'`;
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
        const kpiFieldsValues = `s_trash = 'yes', s_trash_date = '${formattedDate}'`;
        await pool.execute("CALL UpdateStrategies(?,?)", [
          kpiFieldsValues,
          portfolio_id,
        ]);
      }

      if (project_row[0]) {
        const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
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
        const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}'`;
        await pool.execute("CALL UpdateTask(?,?)", [
          taskFieldsValues,
          portfolio_id,
        ]);
      }

      if (subtask_row[0]) {
        const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}'`;
        await pool.execute("CALL UpdateSubtask(?,?)", [
          subtaskFieldsValues,
          portfolio_id,
        ]);
      }
      return res
        .status(200)
        .json({ message: "Portfolio Moved to Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get Portfolio details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Goal
router.patch("/trash/delete/goal/:goal_id/:user_id", async (req, res) => {
  const { goal_id, user_id } = req.params;
  try {
    const [goal_row] = await pool.execute("CALL file_itGoalDetail(?)", [
      goal_id,
    ]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    const goalParentFieldsValues = `g_trash = 'yes', g_trash_date = '${formattedDate}', gsingle_trash = 'yes'`;
    const goalFieldsValues = `g_trash = 'yes', g_trash_date = '${formattedDate}'`;
    const gid = `gid = '${goal_id}'`;

    if (goal_row[0][0]) {
      await pool.execute("CALL UpdateGoals(?,?)", [
        goalParentFieldsValues,
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
        "CALL GoalsAllStrategiesList_not_in_trash(?)",
        [goal_id]
      );
      if (goal_wise_kpis[0]) {
        const kpi_array = goal_wise_kpis[0];
        kpi_array.forEach(async (row) => {
          const kpiFieldsValues = `s_trash = 'yes', s_trash_date = '${formattedDate}', s_single_trash = 'g_yes'`;
          const sid = `sid = '${row.sid}'`;
          await pool.execute("CALL UpdateStrategies(?,?)", [
            kpiFieldsValues,
            sid,
          ]);
          const [kpi_wise_projects] = await pool.execute(
            "CALL StrategyAllProjectsList_not_in_trash(?)",
            [row.sid]
          );
          if (kpi_wise_projects[0]) {
            const project_array = kpi_wise_projects[0];
            project_array.forEach(async (row) => {
              const projectParentFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}', psingle_trash = 'g_yes'`;
              const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
              const pid = `pid = '${row.pid}'`;
              await pool.execute("CALL UpdateProject(?,?)", [
                projectParentFieldsValues,
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

              const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}', tsingle_trash = 'g_yes'`;
              const tproject_assign = `tproject_assign = '${row.pid}'`;
              await pool.execute("CALL UpdateTask(?,?)", [
                taskFieldsValues,
                tproject_assign,
              ]);

              const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 'g_yes'`;
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
      const historyFieldsValues = `"${goal_id}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Goal Moved To Trash By Goal Owner ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [
        historyFieldsNames,
        historyFieldsValues,
      ]);
      return res
        .status(200)
        .json({ message: "Goal Moved To Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get Goal details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete KPI
router.patch("/trash/delete/kpi/:strategy_id/:user_id", async (req, res) => {
  const { strategy_id, user_id } = req.params;
  try {
    const [kpi_row] = await pool.execute("CALL file_itStrategyDetail(?)", [
      strategy_id,
    ]);
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];
    if (kpi_row[0][0]) {
      const kpiFieldsValues = `s_trash = 'yes', s_trash_date = '${formattedDate}', s_single_trash = 'yes'`;
      const sid = `sid = '${strategy_id}'`;
      await pool.execute("CALL UpdateStrategies(?,?)", [kpiFieldsValues, sid]);
      const [kpi_wise_projects] = await pool.execute(
        "CALL StrategyAllProjectsList_not_in_trash(?)",
        [strategy_id]
      );
      if (kpi_wise_projects[0]) {
        const project_array = kpi_wise_projects[0];
        project_array.forEach(async (row) => {
          const projectParentFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}', psingle_trash = 's_yes'`;
          const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
          const pid = `pid = '${row.pid}'`;
          await pool.execute("CALL UpdateProject(?,?)", [
            projectParentFieldsValues,
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

          const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}', tsingle_trash = 's_yes'`;
          const tproject_assign = `tproject_assign = '${row.pid}'`;
          await pool.execute("CALL UpdateTask(?,?)", [
            taskFieldsValues,
            tproject_assign,
          ]);

          const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 's_yes'`;
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
      const historyFieldsValues = `"${strategy_id}", "${kpi_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "KPI Moved to Trash By KPI Owner ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [
        historyFieldsNames,
        historyFieldsValues,
      ]);
      return res
        .status(200)
        .json({ message: "KPI Moved to Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get KPI details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Project
router.patch("/trash/delete/project/:project_id/:user_id", async (req, res) => {
  const { project_id, user_id } = req.params;
  try {
    const [project_row] = await pool.execute("CALL file_itProjectDetail(?,?)", [
      project_id,
      user_id,
    ]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (project_row[0][0]) {
      const projectParentFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}', psingle_trash = 'yes'`;
      const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
      const pid = `pid = '${project_id}'`;
      await pool.execute("CALL UpdateProject(?,?)", [
        projectParentFieldsValues,
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

      const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}', tsingle_trash = 'p_yes'`;
      const tproject_assign = `tproject_assign = '${project_id}'`;
      await pool.execute("CALL UpdateTask(?,?)", [
        taskFieldsValues,
        tproject_assign,
      ]);

      const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 'p_yes'`;
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
      const historyFieldsValues = `"${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Project Moved to Trash By Project Owner ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [
        historyFieldsNames,
        historyFieldsValues,
      ]);
      return res
        .status(200)
        .json({ message: "Project Moved to Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get Project details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Task
router.patch("/trash/delete/task/:task_id/:user_id", async (req, res) => {
  const { task_id, user_id } = req.params;
  try {
    const [task_row] = await pool.execute("CALL file_itgetTaskById(?)", [
      task_id,
    ]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (task_row[0][0]) {
      const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}', tsingle_trash = 't_yes'`;
      const tid = `tid = '${task_id}'`;
      await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tid]);

      const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 't_yes'`;
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
      const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_row[0][0].tcode} Task Moved to Trash By ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [
        historyFieldsNames,
        historyFieldsValues,
      ]);
      return res
        .status(200)
        .json({ message: "Task Moved to Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get Task details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Subtask
router.patch("/trash/delete/subtask/:subtask_id/:user_id", async (req, res) => {
  const { subtask_id, user_id } = req.params;
  try {
    const [subtask_row] = await pool.execute("CALL file_itcheck_subtask(?)", [
      subtask_id,
    ]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (subtask_row[0][0]) {
      const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 'yes'`;
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
      const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].tid}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_row[0][0].stcode} Subtask Moved to Trash By ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [
        historyFieldsNames,
        historyFieldsValues,
      ]);
      return res
        .status(200)
        .json({ message: "Subtask Moved to Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get Task details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Project File
router.patch(
  "/trash/delete/project-file/:project_id/:pfile_id/:user_id",
  async (req, res) => {
    const { project_id, pfile_id, user_id } = req.params;
    try {
      const [project_file_row] = await pool.execute(
        "CALL pfile_detailfile_it(?)",
        [pfile_id]
      );
      const [project_row] = await pool.execute(
        "CALL file_itgetProjectById(?)",
        [project_id]
      );

      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + 1);
      const formattedDate = currentDate.toISOString().split("T")[0];

      if (project_row[0][0]) {
        const pfile = project_file_row[0][0].pfile;
        const trimmedPfile = pfile.trim();
        const indexOfUnderscore = trimmedPfile.indexOf("_");
        const project_file = trimmedPfile.substr(indexOfUnderscore + 1);

        const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
        const file_id = `pfile_id = '${pfile_id}'`;
        await pool.execute("CALL UpdateProjectFiles(?,?)", [
          projectFieldsValues,
          file_id,
        ]);

        const [owner_row] = await pool.execute("CALL getStudentById(?)", [
          user_id,
        ]);
        const student = owner_row[0][0];

        const historyFieldsNames =
          "pfile_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${pfile_id}", "${project_id}", "${
          project_row[0][0].sid
        }", "${project_row[0][0].gid}", "${dateConversion()}", "${
          student.reg_id
        }", "${student.first_name} ${
          student.last_name
        }", "${project_file} Moved to Trash By Project Owner ${
          student.first_name
        } ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [
          historyFieldsNames,
          historyFieldsValues,
        ]);
        return res
          .status(200)
          .json({ message: "Project File Moved to Trash Successfully." });
      } else {
        res.status(400).json({ error: "Failed to get Project details." });
      }
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Delete Task File
router.patch(
  "/trash/delete/task-file/:task_id/:tfile_name/:user_id",
  async (req, res) => {
    const { tfile_name, task_id, user_id } = req.params;
    try {
      const [task_row] = await pool.execute("CALL file_itgetTaskById(?,?)", [
        task_id,
      ]);

      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + 1);
      const formattedDate = currentDate.toISOString().split("T")[0];

      if (task_row[0][0]) {
        const trimmedtfile_name = tfile_name.trim();
        const indexOfUnderscore = trimmedtfile_name.indexOf("_");
        const task_file = trimmedtfile_name.substr(indexOfUnderscore + 1);

        const [owner_row] = await pool.execute("CALL getStudentById(?)", [
          user_id,
        ]);
        const student = owner_row[0][0];

        const historyFieldsNames =
          "pfile_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${pfile_id}", "${
          task_row[0][0].tproject_assign
        }", "${task_row[0][0].sid}", "${
          task_row[0][0].gid
        }", "${dateConversion()}", "${student.reg_id}", "${
          student.first_name
        } ${student.last_name}", "${task_file} Moved to Trash By ${
          student.first_name
        } ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [
          historyFieldsNames,
          historyFieldsValues,
        ]);

        const taskFieldsNames = "pid, tid, tfile, task_trash, task_trash_date";
        const taskFieldsValues = `"${task_row[0][0].tproject_assign}", "${task_row[0][0].tid}", "${task_file}", "yes", "${formattedDate}"`;

        await pool.execute("CALL InsertTaskTrash(?,?)", [
          taskFieldsNames,
          taskFieldsValues,
        ]);

        return res
          .status(200)
          .json({ message: "Task File Moved to Trash Successfully." });
      } else {
        res.status(400).json({ error: "Failed to get Project details." });
      }
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Reopen Portfolio
router.patch(
  "/trash/retrieve/portfolio/:portfolio_id/:user_id",
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
        const [portfolio_row] = await pool.execute("CALL getPortfolio(?,?)", [
          portfolio_id,
          user_id,
        ]);

        const [project_row] = await pool.execute(
          "CALL portfolio_projectsRetriveTrash(?)",
          [portfolio_id]
        );

        if (portfolio_row[0][0]) {
          const portfolioFieldsValues = `portfolio_trash = '', portfolio_trash_date = '', delete_agree = ''`;
          const portfolio_id = `portfolio_id = '${portfolio_id}'`;
          await pool.execute("CALL UpdatePortfolio(?,?)", [
            portfolioFieldsValues,
            portfolio_id,
          ]);

          const goalFieldsValues = `g_trash = '', g_trash_date = ''`;
          await pool.execute("CALL UpdateGoals(?,?)", [
            goalFieldsValues,
            portfolio_id,
          ]);

          const kpiFieldsValues = `s_trash = '', s_trash_date = ''`;
          await pool.execute("CALL UpdateStrategies(?,?)", [
            kpiFieldsValues,
            portfolio_id,
          ]);

          if (project_row[0]) {
            const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
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

          const taskFieldsValues = `trash = '', trash_date = '', tstatus_date = '${dateConversion()}'`;
          await pool.execute("CALL UpdateTask(?,?)", [
            taskFieldsValues,
            portfolio_id,
          ]);

          const subtaskFieldsValues = `strash = '', strash_date = '', ststatus_date = '${dateConversion()}'`;
          await pool.execute("CALL UpdateSubtask(?,?)", [
            subtaskFieldsValues,
            portfolio_id,
          ]);

          return res
            .status(200)
            .json({ message: "Portfolio Restored Successfully." });
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
  "/trash/retrieve/goal/:goal_id/:portfolio_id/:user_id",
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
        const [goal_row] = await pool.execute("CALL check_goal_trash(?,?)", [
          user_id,
          goal_id,
        ]);

        if (goal_row[0][0]) {
          const [portfolio_row] = await pool.execute(
            "CALL checkProjectPorfolioTrash(?)",
            [goal_row[0][0].portfolio_id]
          );
          if (portfolio_row[0][0]) {
            res.status(400).json({
              error:
                "Portfolio is in Trash! To Restore Goal please Restore Portfolio.",
            });
          } else {
            const goalParentFieldsValues = `g_trash = '', g_trash_date = '', gsingle_trash = ''`;
            const goalFieldsValues = `g_trash = '', g_trash_date = ''`;
            const gid = `gid = '${goal_id}'`;
            await pool.execute("CALL UpdateGoals(?,?)", [
              goalParentFieldsValues,
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
              "CALL GoalsAllStrategiesList_in_trash(?)",
              [goal_id]
            );
            if (goal_wise_kpis[0]) {
              const kpi_array = goal_wise_kpis[0];
              kpi_array.forEach(async (row) => {
                const kpiFieldsValues = `s_trash = '', s_trash_date = '', s_single_trash = ''`;
                const sid = `sid = '${row.sid}'`;
                await pool.execute("CALL UpdateStrategies(?,?)", [
                  kpiFieldsValues,
                  sid,
                ]);

                const [kpi_wise_projects] = await pool.execute(
                  "CALL StrategyAllProjectsList_in_trash(?)",
                  [row.sid]
                );
                if (kpi_wise_projects[0]) {
                  const project_array = kpi_wise_projects[0];
                  project_array.forEach(async (row) => {
                    const projectParentFieldsValues = `ptrash = '', ptrash_date = '', psingle_trash = ''`;
                    const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
                    const pid = `pid = '${row.pid}'`;
                    await pool.execute("CALL UpdateProject(?,?)", [
                      projectParentFieldsValues,
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

                    const taskFieldsValues = `trash = '', trash_date = '', tsingle_trash = ''`;
                    const tproject_assign = `tproject_assign = '${row.pid}'`;
                    await pool.execute("CALL UpdateTask(?,?)", [
                      taskFieldsValues,
                      tproject_assign,
                    ]);

                    const subtaskFieldsValues = `strash = '', strash_date = '', stsingle_trash = ''`;
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
            const historyFieldsValues = `"${goal_id}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Goal Restored By ${student.first_name} ${student.last_name}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [
              historyFieldsNames,
              historyFieldsValues,
            ]);
            return res
              .status(200)
              .json({ message: "Goal Restored Successfully." });
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
  "/trash/retrieve/kpi/:strategy_id/:portfolio_id/:user_id",
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
        const [kpi_row] = await pool.execute("CALL check_strategy_trash(?,?)", [
          user_id,
          strategy_id,
        ]);
        if (kpi_row[0][0]) {
          const [goal_row] = await pool.execute(
            "CALL checkStrategyGoalTrash(?)",
            [kpi_row[0][0].gid]
          );
          if (goal_row[0][0]) {
            res.status(400).json({
              error: "Goal is in Trash! To Restore KPI please Restore Goal.",
            });
          } else {
            const kpiFieldsValues = `s_trash = '', s_trash_date = '', s_single_trash = ''`;
            const sid = `sid = '${strategy_id}'`;
            await pool.execute("CALL UpdateStrategies(?,?)", [
              kpiFieldsValues,
              sid,
            ]);

            const [kpi_wise_projects] = await pool.execute(
              "CALL StrategyAllProjectsList_in_trash_strategybulk(?)",
              [strategy_id]
            );
            if (kpi_wise_projects[0]) {
              const project_array = kpi_wise_projects[0];
              project_array.forEach(async (row) => {
                const projectParentFieldsValues = `ptrash = '', ptrash_date = '', psingle_trash = ''`;
                const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
                const pid = `pid = '${row.pid}'`;
                await pool.execute("CALL UpdateProject(?,?)", [
                  projectParentFieldsValues,
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

                const taskFieldsValues = `trash = '', trash_date = '', tsingle_trash = ''`;
                const tproject_assign = `tproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateTask(?,?)", [
                  taskFieldsValues,
                  tproject_assign,
                ]);

                const subtaskFieldsValues = `strash = '', strash_date = '', stsingle_trash = ''`;
                const stproject_assign = `stproject_assign = '${row.pid}'`;
                await pool.execute("CALL UpdateSubtask(?,?)", [
                  subtaskFieldsValues,
                  stproject_assign,
                ]);
              });
            }

            const historyFieldsNames =
              "sid, gid, h_date, h_resource_id, h_resource, h_description";
            const historyFieldsValues = `"${strategy_id}", "${kpi_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "KPI Restored By ${student.first_name} ${student.last_name}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [
              historyFieldsNames,
              historyFieldsValues,
            ]);
            return res
              .status(200)
              .json({ message: "KPI Restored Successfully." });
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
  "/trash/retrieve/project/:project_id/:portfolio_id/:user_id",
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
        const [project_row] = await pool.execute("CALL check_ptrash(?,?)", [
          project_id,
          user_id,
        ]);
        if (project_row[0][0]) {
          const [portfolio_row] = await pool.execute(
            "CALL checkProjectPorfolioTrash(?)",
            [project_row[0][0].portfolio_id]
          );
          if (portfolio_row[0][0]) {
            res.status(400).json({
              error:
                "Portfolio is in Trash! To Restore Project please Restore Portfolio.",
            });
          } else {
            const [kpi_row] = await pool.execute(
              "CALL checkProjectStrategyTrash(?)",
              [project_row[0][0].sid]
            );
            if (kpi_row[0][0]) {
              res.status(400).json({
                error:
                  "KPI is in Trash! To Restore Project please Restore KPI.",
              });
            } else {
              const projectParentFieldsValues = `ptrash = '', ptrash_date = '', psingle_trash = ''`;
              const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
              const pid = `pid = '${project_id}'`;
              await pool.execute("CALL UpdateProject(?,?)", [
                projectParentFieldsValues,
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

              const taskFieldsValues = `trash = '', trash_date = '', tsingle_trash = ''`;
              const tproject_assign = `tproject_assign = '${project_id}'`;
              await pool.execute("CALL UpdateTask(?,?)", [
                taskFieldsValues,
                tproject_assign,
              ]);

              const subtaskFieldsValues = `strash = '', strash_date = '', , stsingle_trash = ''`;
              const stproject_assign = `stproject_assign = '${project_id}'`;
              await pool.execute("CALL UpdateSubtask(?,?)", [
                subtaskFieldsValues,
                stproject_assign,
              ]);

              const historyFieldsNames =
                "pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
              const historyFieldsValues = `"${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Project Restored By ${student.first_name} ${student.last_name}"`;

              await pool.execute("CALL InsertProjectHistory(?,?)", [
                historyFieldsNames,
                historyFieldsValues,
              ]);
              return res
                .status(200)
                .json({ message: "Project Restored Successfully." });
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
  "/trash/retrieve/task/:task_id/:portfolio_id/:user_id",
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
        const [task_row] = await pool.execute("CALL check_task2(?)", [task_id]);
        if (task_row[0][0]) {
          const [project_row] = await pool.execute(
            "CALL checkTaskProjectTrash(?)",
            [task_row[0][0].tproject_assign]
          );
          if (project_row[0][0]) {
            res.status(400).json({
              error:
                "Project is in Trash! To Restore Task please Restore Project.",
            });
          } else {
            const taskFieldsValues = `trash = '', trash_date = '', tstatus_date = '${formattedDate}', tsingle_trash = ''`;
            const tid = `tid = '${task_id}'`;
            await pool.execute("CALL UpdateTask(?,?)", [
              taskFieldsValues,
              tid,
            ]);

            const subtaskFieldsValues = `strash = '', strash_date = '', ststatus_date = '${formattedDate}', stsingle_trash = ''`;
            await pool.execute("CALL UpdateSubtask(?,?)", [
              subtaskFieldsValues,
              tid,
            ]);

            const historyFieldsNames =
              "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
            const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_row[0][0].tcode} Task Restored By ${student.first_name} ${student.last_name}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [
              historyFieldsNames,
              historyFieldsValues,
            ]);
            return res
              .status(200)
              .json({ message: "Task Restored Successfully." });
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
router.patch( "/trash/retrieve/subtask/:subtask_id/:user_id",
  async (req, res) => {
    const { subtask_id, user_id } = req.params;
    try {
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [
        user_id,
      ]);
      const student = owner_row[0][0];
      const formattedDate = dateConversion();
      const [subtask_row] = await pool.execute("CALL check_subtask2(?)", [
        subtask_id,
      ]);
      if (subtask_row[0][0]) {
        const [task_row] = await pool.execute("CALL checkFileTaskTrash(?)", [
          subtask_row[0][0].tid,
        ]);
        if (task_row[0][0]) {
          res.status(400).json({
            error: "Task is in Trash! To Restore Subtask please Restore Task.",
          });
        } else {
          const subtaskFieldsValues = `strash = '', strash_date = '', ststatus_date = '${formattedDate}', stsingle_trash = ''`;
          const stid = `stid = '${subtask_id}'`;
          await pool.execute("CALL UpdateSubtask(?,?)", [
            subtaskFieldsValues,
            stid,
          ]);

          const historyFieldsNames =
            "subtask_id, task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].tid}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${formattedDate}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_row[0][0].stcode} Subtask Restored By ${student.first_name} ${student.last_name}"`;

          await pool.execute("CALL InsertProjectHistory(?,?)", [
            historyFieldsNames,
            historyFieldsValues,
          ]);
          return res
            .status(200)
            .json({ message: "Subtask Restored Successfully." });
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

// Reopen Project File
router.patch(
  "/trash/retrieve/project-file/:project_id/:pfile_id/:user_id",
  async (req, res) => {
    const { project_id, pfile_id, user_id } = req.params;
    try {
      const [project_file_row] = await pool.execute(
        "CALL check_pfile_trash(?)",
        [pfile_id]
      );
      const [project_trash] = await pool.execute(
        "CALL checkFileProjectTrash(?)",
        [project_id]
      );
      if(project_trash[0][0]){
        res.status(400).json({
          error: "Project is in Trash! To Restore File please Restore Project.",
        });
      }else{
        const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
        const file_id = `pfile_id = '${pfile_id}'`;
        await pool.execute("CALL UpdateProjectFiles(?,?)", [
          projectFieldsValues,
          file_id,
        ]);

        const [project_row] = await pool.execute(
          "CALL file_itgetProjectById(?,?)",
          [project_id]
        );

        if (project_row[0][0]) {
          const pfile = project_file_row[0][0].pfile;
          const trimmedPfile = pfile.trim();
          const indexOfUnderscore = trimmedPfile.indexOf("_");
          const project_file = trimmedPfile.substr(indexOfUnderscore + 1);         
  
          const [owner_row] = await pool.execute("CALL getStudentById(?)", [
            user_id,
          ]);
          const student = owner_row[0][0];
  
          const historyFieldsNames =
            "pfile_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${pfile_id}", "${project_id}", "${
            project_row[0][0].sid
          }", "${project_row[0][0].gid}", "${dateConversion()}", "${
            student.reg_id
          }", "${student.first_name} ${
            student.last_name
          }", "${project_file} Restored By ${
            student.first_name
          } ${student.last_name}"`;
  
          await pool.execute("CALL InsertProjectHistory(?,?)", [
            historyFieldsNames,
            historyFieldsValues,
          ]);
          return res
            .status(200)
            .json({ message: "Project File Restored Successfully." });
        } else {
          res.status(400).json({ error: "Failed to get Project details." });
        }
      } 
    } catch (error) {
      console.error("Error executing stored procedure:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
