const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const { dateConversion } = require("../utils/common-functions");
const moment = require("moment");

// Get All Data Trash Modules
router.get("/trash/all-data/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;
  try {
    const [trash_goals] = await pool.execute("CALL TrashGoals(?,?)", [user_id, portfolio_id]);
    const [trash_kpis] = await pool.execute("CALL TrashStrategies(?,?)", [user_id, portfolio_id]);
    const [trash_projects] = await pool.execute("CALL TrashProjects(?,?)", [portfolio_id, user_id]);
    const [trash_tasks] = await pool.execute("CALL TrashTasks(?,?)", [user_id, portfolio_id]);
    const [trash_single_tasks] = await pool.execute("CALL TrashSingleTasks(?,?)", [user_id, portfolio_id]);
    const [trash_subtasks] = await pool.execute("CALL TrashSubtasks(?,?)", [portfolio_id, user_id]);
    const [trash_single_subtasks] = await pool.execute("CALL TrashSingleSubtasks(?,?)", [portfolio_id, user_id]);
    const [trash_ProjectFiles] = await pool.execute("CALL TrashProjectFiles(?)", [portfolio_id]);
    const [trash_TaskFiles] = await pool.execute("CALL TrashTaskFiles(?)", [portfolio_id]);
    const [trash_SubtaskFiles] = await pool.execute("CALL TrashSubtaskFiles(?)", [portfolio_id]);

    const trash_goals_data = trash_goals[0];
    let trash_goals_parent = [];
    if (trash_goals_data) {
      const trash_goals_promises = trash_goals_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const goalDate = row.g_trash_date;
        const jsDate = new Date(goalDate);
        const formattedGoalDate = jsDate.toISOString().split("T")[0];
        return {
          id: `goal-${row.gid}`,
          table_id: row.gid,
          all_portfolio: portfolioName,
          all_trash: row.gname,
          all_title: "",
          all_type: "Goal",
          all_date: formattedGoalDate,
        };
      });
      trash_goals_parent = (await Promise.all(trash_goals_promises)).flat();
    }

    const trash_kpis_data = trash_kpis[0];
    let trash_kpis_parent = [];
    if (trash_kpis_data) {
      const trash_kpis_promises = trash_kpis_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const kpiDate = row.s_trash_date;
        const jsDate = new Date(kpiDate);
        const formattedkpiDate = jsDate.toISOString().split("T")[0];
        return {
          id: `kpi-${row.sid}`,
          table_id: row.sid,
          all_portfolio: portfolioName,
          all_trash: row.sname,
          all_title: "",
          all_type: "KPI",
          all_date: formattedkpiDate,
        };
      });
      trash_kpis_parent = (await Promise.all(trash_kpis_promises)).flat();
    }

    const trash_projects_data = trash_projects[0];
    let trash_projects_parent = [];
    if (trash_projects_data) {
      const trash_projects_promises = trash_projects_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const projectDate = row.ptrash_date;
        const jsDate = new Date(projectDate);
        const formattedprojectDate = jsDate.toISOString().split("T")[0];
        return {
          id: `project-${row.pid}`,
          table_id: row.pid,
          all_portfolio: portfolioName,
          all_trash: row.pname,
          all_title: "",
          all_type: "Project",
          all_date: formattedprojectDate,
        };
      });
      trash_projects_parent = (await Promise.all(trash_projects_promises)).flat();
    }

    const trash_tasks_data = trash_tasks[0];
    let trash_tasks_parent = [];
    if (trash_tasks_data) {
      const trash_tasks_promises = trash_tasks_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const taskDate = row.trash_date;
        const jsDate = new Date(taskDate);
        const formattedtaskDate = jsDate.toISOString().split("T")[0];
        return {
          id: `task-${row.tid}`,
          table_id: row.tid,
          all_portfolio: portfolioName,
          all_trash: row.tname,
          all_title: row.pname,
          all_type: "Task",
          all_date: formattedtaskDate,
        };
      });
      trash_tasks_parent = (await Promise.all(trash_tasks_promises)).flat();
    }

    const trash_single_tasks_data = trash_single_tasks[0];
    let trash_single_tasks_parent = [];
    if (trash_single_tasks_data) {
      const trash_single_tasks_promises = trash_single_tasks_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const single_taskDate = row.trash_date;
        const jsDate = new Date(single_taskDate);
        const formattedsingle_taskDate = jsDate.toISOString().split("T")[0];
        return {
          id: `task-${row.tid}`,
          table_id: row.tid,
          all_portfolio: portfolioName,
          all_trash: row.tname,
          all_title: "",
          all_type: "Task",
          all_date: formattedsingle_taskDate,
        };
      });
      trash_single_tasks_parent = (await Promise.all(trash_single_tasks_promises)).flat();
    }

    const trash_subtasks_data = trash_subtasks[0];
    let trash_subtasks_parent = [];
    if (trash_subtasks_data) {
      const trash_subtasks_promises = trash_subtasks_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const subtaskDate = row.strash_date;
        const jsDate = new Date(subtaskDate);
        const formattedsubtaskDate = jsDate.toISOString().split("T")[0];
        return {
          id: `subtask-${row.stid}`,
          table_id: row.stid,
          all_portfolio: portfolioName,
          all_trash: row.stname,
          all_title: row.pname,
          all_type: "Subtask",
          all_date: formattedsubtaskDate,
        };
      });
      trash_subtasks_parent = (await Promise.all(trash_subtasks_promises)).flat();
    }

    const trash_single_subtasks_data = trash_single_subtasks[0];
    let trash_single_subtasks_parent = [];
    if (trash_single_subtasks_data) {
      const trash_single_subtasks_promises = trash_single_subtasks_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const single_subtaskDate = row.strash_date;
        const jsDate = new Date(single_subtaskDate);
        const formattedsingle_subtaskDate = jsDate.toISOString().split("T")[0];
        return {
          id: `subtask-${row.stid}`,
          table_id: row.stid,
          all_portfolio: portfolioName,
          all_trash: row.stname,
          all_title: "",
          all_type: "Subtask",
          all_date: formattedsingle_subtaskDate,
        };
      });
      trash_single_subtasks_parent = (await Promise.all(trash_single_subtasks_promises)).flat();
    }

    const trash_projectFiles_data = trash_ProjectFiles[0];
    let trash_projectFiles_parent = [];
    if (trash_projectFiles_data) {
      const trash_projectFiles_promises = trash_projectFiles_data.map(async (row) => {
        const [project_detail] = await pool.execute("CALL file_itgetProjectById2(?)", [row.pid]);
        const check_project = project_detail[0][0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        if (check_project) {
          if (check_project.pcreated_by == user_id) {
            const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

            const projectDate = row.pfptrash_date;
            const jsDate = new Date(projectDate);
            const formattedprojectDate = jsDate.toISOString().split("T")[0];
            return {
              id: `project-file-${row.pfile_id}`,
              table_id: row.pfile_id,
              module_id: row.pid,
              all_portfolio: portfolioName,
              all_trash: row.pfile.substring(row.pfile.indexOf("_") + 1),
              all_title: row.pname,
              all_type: "Project File",
              all_date: formattedprojectDate,
            };
          }
        }
      });
      trash_projectFiles_parent = await Promise.all(trash_projectFiles_promises);
    }

    const trash_memberFiles_data = trash_ProjectFiles[0];
    let trash_memberFiles_parent = [];
    if (trash_memberFiles_data && trash_memberFiles_data.length > 0) {
      const trash_memberFiles_promises = trash_memberFiles_data.map(async (row) => {
        const [pmember_detail] = await pool.execute("CALL file_itgetMemberProject(?)", [row.pid]);
        const check_pmember = pmember_detail[0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const projectDate = row.pfptrash_date;
        const jsDate = new Date(projectDate);
        const formattedprojectDate = jsDate.toISOString().split("T")[0];

        if (check_pmember) {
          return check_pmember.map(async (row1) => {
            if (row1.status == "accepted" && row1.pmember == user_id) {
              return {
                id: `project-file-${row.pfile_id}`,
                table_id: row.pfile_id,
                module_id: row.pid,
                all_portfolio: portfolioName,
                all_trash: row.pfile.substring(row.pfile.indexOf("_") + 1),
                all_title: row.pname,
                all_type: "Project File",
                all_date: formattedprojectDate,
              };
            }
          });
        }
      });

      const processedData = (await Promise.all(trash_memberFiles_promises)).flat().filter((item) => Object.keys(item).length > 0);
      trash_memberFiles_parent = processedData.filter(Boolean);
    }

    const trash_taskFiles_data = trash_TaskFiles[0];
    let trash_taskFiles_parent = [];
    if (trash_taskFiles_data) {
      const trash_taskFiles_promises = trash_taskFiles_data.map(async (row) => {
        const [task_detail] = await pool.execute("CALL file_itgetProjectById2(?)", [row.pid]);
        const check_task = task_detail[0][0];
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        if (check_task) {
          if (check_task.pcreated_by == user_id) {
            const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

            const taskDate = row.task_trash_date;
            const jsDate = new Date(taskDate);
            const formattedtaskDate = jsDate.toISOString().split("T")[0];
            return {
              id: `task-file-${row.trash_id}`,
              table_id: row.trash_id,
              module_id: row.tid,
              file_name: row.tfile,
              all_portfolio: portfolioName,
              all_trash: row.tfile.substring(row.tfile.indexOf("_") + 1),
              all_title: row.tname,
              all_type: "Task File",
              all_date: formattedtaskDate,
            };
          }
        }
      });
      trash_taskFiles_parent = await Promise.all(trash_taskFiles_promises);
    }

    const trash_memberTaskFiles_data = trash_TaskFiles[0];
    let trash_memberTaskFiles_parent = [];
    if (trash_memberTaskFiles_data && trash_memberTaskFiles_data.length > 0) {
      const trash_memberTaskFiles_promises = trash_memberTaskFiles_data.map(async (row) => {
        const [pmember_detail] = await pool.execute("CALL file_itgetMemberProject(?)", [row.pid]);
        const check_pmember = pmember_detail[0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const taskDate = row.task_trash_date;
        const jsDate = new Date(taskDate);
        const formattedtaskDate = jsDate.toISOString().split("T")[0];

        if (check_pmember) {
          return check_pmember.map(async (row1) => {
            if (row1.status == "accepted" && row1.pmember == user_id) {
              return {
                id: `task-file-${row.trash_id}`,
                table_id: row.trash_id,
                module_id: row.tid,
                file_name: row.tfile,
                all_portfolio: portfolioName,
                all_trash: row.tfile.substring(row.tfile.indexOf("_") + 1),
                all_title: row.tname,
                all_type: "Task File",
                all_date: formattedtaskDate,
              };
            }
          });
        }
      });

      const processedData = (await Promise.all(trash_memberTaskFiles_promises)).flat().filter((item) => Object.keys(item).length > 0);
      trash_memberTaskFiles_parent = processedData.filter(Boolean);
    }

    const trash_subtaskFiles_data = trash_SubtaskFiles[0];
    let trash_subtaskFiles_parent = [];
    if (trash_subtaskFiles_data) {
      const trash_subtaskFiles_promises = trash_subtaskFiles_data.map(async (row) => {
        const [subtask_detail] = await pool.execute("CALL file_itgetProjectById2(?)", [row.pid]);
        const check_subtask = subtask_detail[0][0];
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        if (check_subtask) {
          if (check_subtask.pcreated_by == user_id) {
            const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

            const subtaskDate = row.stask_trash_date;
            const jsDate = new Date(subtaskDate);
            const formattedsubtaskDate = jsDate.toISOString().split("T")[0];
            return {
              id: `subtask-file-${row.strash_id}`,
              table_id: row.strash_id,
              module_id: row.stid,
              file_name: row.stfile,
              all_portfolio: portfolioName,
              all_trash: row.stfile.substring(row.stfile.indexOf("_") + 1),
              all_title: row.stname,
              all_type: "Subtask File",
              all_date: formattedsubtaskDate,
            };
          }
        }
      });
      trash_subtaskFiles_parent = await Promise.all(trash_subtaskFiles_promises);
    }

    const trash_memberSubtaskFiles_data = trash_SubtaskFiles[0];
    let trash_memberSubtaskFiles_parent = [];
    if (trash_memberSubtaskFiles_data && trash_memberSubtaskFiles_data.length > 0) {
      const trash_memberSubtaskFiles_promises = trash_memberSubtaskFiles_data.map(async (row) => {
        const [pmember_detail] = await pool.execute("CALL file_itgetMemberProject(?)", [row.pid]);
        const check_pmember = pmember_detail[0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const subtaskDate = row.stask_trash_date;
        const jsDate = new Date(subtaskDate);
        const formattedsubtaskDate = jsDate.toISOString().split("T")[0];

        if (check_pmember) {
          return check_pmember.map(async (row1) => {
            if (row1.status == "accepted" && row1.pmember == user_id) {
              return {
                id: `subtask-file-${row.strash_id}`,
                table_id: row.strash_id,
                module_id: row.stid,
                file_name: row.stfile,
                all_portfolio: portfolioName,
                all_trash: row.stfile.substring(row.stfile.indexOf("_") + 1),
                all_title: row.stname,
                all_type: "Subtask File",
                all_date: formattedsubtaskDate,
              };
            }
          });
        }
      });

      const processedData = (await Promise.all(trash_memberSubtaskFiles_promises)).flat().filter((item) => Object.keys(item).length > 0);
      trash_memberSubtaskFiles_parent = processedData.filter(Boolean);
    }

    const all_trash_data = [...trash_goals_parent, ...trash_kpis_parent, ...trash_projects_parent, ...trash_tasks_parent, ...trash_single_tasks_parent, ...trash_subtasks_parent, ...trash_single_subtasks_parent, ...trash_projectFiles_parent, ...trash_memberFiles_parent, ...trash_taskFiles_parent, ...trash_memberTaskFiles_parent, ...trash_subtaskFiles_parent, ...trash_memberSubtaskFiles_parent];

    // res.status(200).json(all_trash_data);
    return res.status(200).json(all_trash_data.filter(Boolean));
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Goal Trash Modules
router.get("/trash/goal-data/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;
  try {
    const [trash_goals] = await pool.execute("CALL TrashGoals(?,?)", [user_id, portfolio_id]);

    const trash_goals_data = trash_goals[0];
    let trash_goals_parent = [];
    if (trash_goals_data) {
      const trash_goals_promises = trash_goals_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const goalDate = row.g_trash_date;
        const jsDate = new Date(goalDate);
        const formattedGoalDate = jsDate.toISOString().split("T")[0];
        return {
          id: `goal-${row.gid}`,
          table_id: row.gid,
          goal_portfolio: portfolioName,
          goal_goal: row.gname,
          goal_type: "Goal",
          goal_date: formattedGoalDate,
        };
      });
      trash_goals_parent = (await Promise.all(trash_goals_promises)).flat();
    }

    res.status(200).json(trash_goals_parent);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get KPI Trash Modules
router.get("/trash/kpi-data/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;
  try {
    const [trash_kpis] = await pool.execute("CALL TrashStrategies(?,?)", [user_id, portfolio_id]);

    const trash_kpis_data = trash_kpis[0];
    let trash_kpis_parent = [];
    if (trash_kpis_data) {
      const trash_kpis_promises = trash_kpis_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const kpiDate = row.s_trash_date;
        const jsDate = new Date(kpiDate);
        const formattedkpiDate = jsDate.toISOString().split("T")[0];
        return {
          id: `kpi-${row.sid}`,
          table_id: row.sid,
          kpi_portfolio: portfolioName,
          kpi_kpi: row.sname,
          kpi_type: "KPI",
          kpi_date: formattedkpiDate,
        };
      });
      trash_kpis_parent = (await Promise.all(trash_kpis_promises)).flat();
    }

    res.status(200).json(trash_kpis_parent);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Project Trash Modules
router.get("/trash/project-data/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;
  try {
    const [trash_projects] = await pool.execute("CALL TrashProjects(?,?)", [portfolio_id, user_id]);

    const trash_projects_data = trash_projects[0];
    let trash_projects_parent = [];
    if (trash_projects_data) {
      const trash_projects_promises = trash_projects_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const projectDate = row.ptrash_date;
        const jsDate = new Date(projectDate);
        const formattedprojectDate = jsDate.toISOString().split("T")[0];
        return {
          id: `project-${row.pid}`,
          table_id: row.pid,
          project_portfolio: portfolioName,
          project_project: row.pname,
          project_type: "Project",
          project_date: formattedprojectDate,
        };
      });
      trash_projects_parent = (await Promise.all(trash_projects_promises)).flat();
    }

    res.status(200).json(trash_projects_parent);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Task Trash Modules
router.get("/trash/task-data/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;
  try {
    const [trash_tasks] = await pool.execute("CALL TrashTasks(?,?)", [user_id, portfolio_id]);
    const [trash_single_tasks] = await pool.execute("CALL TrashSingleTasks(?,?)", [user_id, portfolio_id]);
    const [trash_subtasks] = await pool.execute("CALL TrashSubtasks(?,?)", [portfolio_id, user_id]);
    const [trash_single_subtasks] = await pool.execute("CALL TrashSingleSubtasks(?,?)", [portfolio_id, user_id]);

    const trash_tasks_data = trash_tasks[0];
    let trash_tasks_parent = [];
    if (trash_tasks_data) {
      const trash_tasks_promises = trash_tasks_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const taskDate = row.trash_date;
        const jsDate = new Date(taskDate);
        const formattedtaskDate = jsDate.toISOString().split("T")[0];

        const [assignee_del] = await pool.execute("CALL getStudentById(?)", [row.tassignee]);
        const assigneeName = `${assignee_del[0][0].first_name} ${assignee_del[0][0].last_name}`;
        return {
          id: `task-${row.tid}`,
          table_id: row.tid,
          task_code: row.tcode,
          task_portfolio: portfolioName,
          task_project: row.pname,
          task_task: row.tname,
          task_assignee: assigneeName,
          task_type: "Task",
          task_date: formattedtaskDate,
        };
      });
      trash_tasks_parent = (await Promise.all(trash_tasks_promises)).flat();
    }

    const trash_single_tasks_data = trash_single_tasks[0];
    let trash_single_tasks_parent = [];
    if (trash_single_tasks_data) {
      const trash_single_tasks_promises = trash_single_tasks_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const single_taskDate = row.trash_date;
        const jsDate = new Date(single_taskDate);
        const formattedsingle_taskDate = jsDate.toISOString().split("T")[0];

        const [assignee_del] = await pool.execute("CALL getStudentById(?)", [row.tassignee]);
        const assigneeName = `${assignee_del[0][0].first_name} ${assignee_del[0][0].last_name}`;
        return {
          id: `task-${row.tid}`,
          table_id: row.tid,
          task_code: row.tcode,
          task_portfolio: portfolioName,
          task_task: row.tname,
          task_project: "",
          task_assignee: assigneeName,
          task_type: "Task",
          task_date: formattedsingle_taskDate,
        };
      });
      trash_single_tasks_parent = (await Promise.all(trash_single_tasks_promises)).flat();
    }

    const trash_subtasks_data = trash_subtasks[0];
    let trash_subtasks_parent = [];
    if (trash_subtasks_data) {
      const trash_subtasks_promises = trash_subtasks_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const subtaskDate = row.strash_date;
        const jsDate = new Date(subtaskDate);
        const formattedsubtaskDate = jsDate.toISOString().split("T")[0];

        const [assignee_del] = await pool.execute("CALL getStudentById(?)", [row.stassignee]);
        const assigneeName = `${assignee_del[0][0].first_name} ${assignee_del[0][0].last_name}`;
        return {
          id: `subtask-${row.stid}`,
          table_id: row.stid,
          task_code: row.stcode,
          task_portfolio: portfolioName,
          task_task: row.stname,
          task_project: row.pname,
          task_assignee: assigneeName,
          task_type: "Subtask",
          task_date: formattedsubtaskDate,
        };
      });
      trash_subtasks_parent = (await Promise.all(trash_subtasks_promises)).flat();
    }

    const trash_single_subtasks_data = trash_single_subtasks[0];
    let trash_single_subtasks_parent = [];
    if (trash_single_subtasks_data) {
      const trash_single_subtasks_promises = trash_single_subtasks_data.map(async (row) => {
        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        const single_subtaskDate = row.strash_date;
        const jsDate = new Date(single_subtaskDate);
        const formattedsingle_subtaskDate = jsDate.toISOString().split("T")[0];

        const [assignee_del] = await pool.execute("CALL getStudentById(?)", [row.stassignee]);
        const assigneeName = `${assignee_del[0][0].first_name} ${assignee_del[0][0].last_name}`;
        return {
          id: `subtask-${row.stid}`,
          table_id: row.stid,
          task_code: row.stcode,
          task_portfolio: portfolioName,
          task_task: row.stname,
          task_project: "",
          task_assignee: assigneeName,
          task_type: "Subtask",
          task_date: formattedsingle_subtaskDate,
        };
      });
      trash_single_subtasks_parent = (await Promise.all(trash_single_subtasks_promises)).flat();
    }

    const all_trash_data = [...trash_tasks_parent, ...trash_single_tasks_parent, ...trash_subtasks_parent, ...trash_single_subtasks_parent];

    res.status(200).json(all_trash_data);
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Files Trash Modules
router.get("/trash/files-data/:user_id/:portfolio_id", async (req, res) => {
  const { user_id, portfolio_id } = req.params;

  try {
    const [trash_ProjectFiles] = await pool.execute("CALL TrashProjectFiles(?)", [portfolio_id]);
    const trash_projectFiles_data = trash_ProjectFiles[0];

    const [trash_TaskFiles] = await pool.execute("CALL TrashTaskFiles(?)", [portfolio_id]);
    const trash_taskFiles_data = trash_TaskFiles[0];

    const [trash_SubtaskFiles] = await pool.execute("CALL TrashSubtaskFiles(?)", [portfolio_id]);
    const trash_subtaskFiles_data = trash_SubtaskFiles[0];

    let trash_projectFiles_promises = [];
    let trash_memberFiles_promises = [];
    let trash_taskFiles_promises = [];
    let trash_memberTaskFiles_promises = [];
    let trash_subtaskFiles_promises = [];
    let trash_memberSubtaskFiles_promises = [];

    if (trash_projectFiles_data) {
      trash_projectFiles_promises = trash_projectFiles_data.map(async (row) => {
        const [project_detail] = await pool.execute("CALL file_itgetProjectById2(?)", [row.pid]);
        const check_project = project_detail[0][0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;

        if (check_project && check_project.pcreated_by == user_id) {
          const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

          const projectDate = row.pfptrash_date;
          const jsDate = new Date(projectDate);
          const formattedprojectDate = jsDate.toISOString().split("T")[0];

          return {
            id: `project-file-${row.pfile_id}`,
            table_id: row.pfile_id,
            module_id: row.pid,
            file_portfolio: portfolioName,
            file_file: row.pfile.substring(row.pfile.indexOf("_") + 1),
            file_title: row.pname,
            file_type: "Project File",
            file_date: formattedprojectDate,
          };
        }
      });
    }

    if (trash_projectFiles_data) {
      const trash_memberFiles_data = trash_ProjectFiles[0];
      trash_memberFiles_promises = trash_memberFiles_data.map(async (row) => {
        const [pmember_detail] = await pool.execute("CALL file_itgetMemberProject(?)", [row.pid]);
        const check_pmember = pmember_detail[0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        if (check_pmember) {
          check_pmember.forEach(async (row1) => {
            if (row1.status == "accepted" && row1.pmember == user_id) {
              const projectDate = row.pfptrash_date;
              const jsDate = new Date(projectDate);
              const formattedprojectDate = jsDate.toISOString().split("T")[0];

              return {
                id: `project-${row.pfile_id}`,
                table_id: row.pfile_id,
                module_id: row.pid,
                file_portfolio: portfolioName,
                file_file: row.pfile.substring(row.pfile.indexOf("_") + 1),
                file_title: row.pname,
                file_type: "Project File",
                file_date: formattedprojectDate,
              };
            }
          });
        }
      });
    }

    if (trash_taskFiles_data) {
      trash_taskFiles_promises = trash_taskFiles_data.map(async (row) => {
        const [task_detail] = await pool.execute("CALL file_itgetProjectById2(?)", [row.pid]);
        const check_task = task_detail[0][0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;

        if (check_task && check_task.pcreated_by == user_id) {
          const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

          const taskDate = row.task_trash_date;
          const jsDate = new Date(taskDate);
          const formattedtaskDate = jsDate.toISOString().split("T")[0];

          return {
            id: `task-file-${row.trash_id}`,
            table_id: row.trash_id,
            module_id: row.tid,
            file_name: row.tfile,
            file_portfolio: portfolioName,
            file_file: row.tfile.substring(row.tfile.indexOf("_") + 1),
            file_title: row.tname,
            file_type: "Task File",
            file_date: formattedtaskDate,
          };
        }
      });
    }

    if (trash_taskFiles_data) {
      const trash_memberTaskFiles_data = trash_TaskFiles[0];
      trash_memberTaskFiles_promises = trash_memberTaskFiles_data.map(async (row) => {
        const [pmember_detail] = await pool.execute("CALL file_itgetMemberProject(?)", [row.pid]);
        const check_pmember = pmember_detail[0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        if (check_pmember) {
          check_pmember.forEach(async (row1) => {
            if (row1.status == "accepted" && row1.pmember == user_id) {
              const taskDate = row.task_trash_date;
              const jsDate = new Date(taskDate);
              const formattedtaskDate = jsDate.toISOString().split("T")[0];

              return {
                id: `task-${row.trash_id}`,
                table_id: row.trash_id,
                module_id: row.tid,
                file_name: row.tfile,
                file_portfolio: portfolioName,
                file_file: row.tfile.substring(row.tfile.indexOf("_") + 1),
                file_title: row.tname,
                file_type: "Task File",
                file_date: formattedtaskDate,
              };
            }
          });
        }
      });
    }

    if (trash_subtaskFiles_data) {
      trash_subtaskFiles_promises = trash_subtaskFiles_data.map(async (row) => {
        const [subtask_detail] = await pool.execute("CALL file_itgetProjectById2(?)", [row.pid]);
        const check_subtask = subtask_detail[0][0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;

        if (check_subtask && check_subtask.pcreated_by == user_id) {
          const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

          const subtaskDate = row.stask_trash_date;
          const jsDate = new Date(subtaskDate);
          const formattedsubtaskDate = jsDate.toISOString().split("T")[0];

          return {
            id: `subtask-file-${row.strash_id}`,
            table_id: row.strash_id,
            module_id: row.stid,
            file_name: row.stfile,
            file_portfolio: portfolioName,
            file_file: row.stfile.substring(row.stfile.indexOf("_") + 1),
            file_title: row.stname,
            file_type: "Subtask File",
            file_date: formattedsubtaskDate,
          };
        }
      });
    }

    if (trash_subtaskFiles_data) {
      const trash_memberSubtaskFiles_data = trash_SubtaskFiles[0];
      trash_memberSubtaskFiles_promises = trash_memberSubtaskFiles_data.map(async (row) => {
        const [pmember_detail] = await pool.execute("CALL file_itgetMemberProject(?)", [row.pid]);
        const check_pmember = pmember_detail[0];

        const [portfolio_del] = await pool.execute("CALL getPortfolioById(?)", [row.portfolio_id]);
        const portfolioUser = portfolio_del[0][0].portfolio_user;
        const portfolioName = portfolioUser == "company" ? portfolio_del[0][0].portfolio_name : portfolioUser == "individual" ? `${portfolio_del[0][0].portfolio_name} ${portfolio_del[0][0].portfolio_mname} ${portfolio_del[0][0].portfolio_lname}` : portfolio_del[0][0].portfolio_name;

        if (check_pmember) {
          check_pmember.forEach(async (row1) => {
            if (row1.status == "accepted" && row1.pmember == user_id) {
              const subtaskDate = row.stask_trash_date;
              const jsDate = new Date(subtaskDate);
              const formattedsubtaskDate = jsDate.toISOString().split("T")[0];

              return {
                id: `subtask-${row.strash_id}`,
                table_id: row.strash_id,
                module_id: row.stid,
                file_name: row.stfile,
                file_portfolio: portfolioName,
                file_file: row.stfile.substring(row.stfile.indexOf("_") + 1),
                file_title: row.stname,
                file_type: "Subtask File",
                file_date: formattedsubtaskDate,
              };
            }
          });
        }
      });
    }

    const [trash_projectFiles_parent, trash_memberFiles_parent, trash_taskFiles_parent, trash_memberTaskFiles_parent, trash_subtaskFiles_parent, trash_memberSubtaskFiles_parent] = await Promise.all([Promise.all(trash_projectFiles_promises), Promise.all(trash_memberFiles_promises), Promise.all(trash_taskFiles_promises), Promise.all(trash_memberTaskFiles_promises), Promise.all(trash_subtaskFiles_promises), Promise.all(trash_memberSubtaskFiles_promises)]);

    const project_file_data = [...trash_projectFiles_parent.flat().filter(Boolean), ...trash_memberFiles_parent.flat().filter(Boolean), ...trash_taskFiles_parent.flat().filter(Boolean), ...trash_memberTaskFiles_parent.flat().filter(Boolean), ...trash_subtaskFiles_parent.flat().filter(Boolean), ...trash_memberSubtaskFiles_parent.flat().filter(Boolean)];

    return res.status(200).json(project_file_data);
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
    const [portfolio_row] = await pool.execute("CALL getPortfolio(?,?)", [portf_id, user_id]);
    const [goal_row] = await pool.execute("CALL portfolio_goalsTrash(?)", [portf_id]);
    const [kpi_row] = await pool.execute("CALL portfolio_strategiesTrash(?)", [portf_id]);
    const [project_row] = await pool.execute("CALL portfolio_projectsTrash(?)", [portf_id]);
    const [task_row] = await pool.execute("CALL getPortfolioAllTaskTrash(?)", [portf_id]);
    const [subtask_row] = await pool.execute("CALL getPortfolioAllSubtaskTrash(?)", [portf_id]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    const portfolioFieldsValues = `portfolio_trash = 'yes', portfolio_trash_date = '${formattedDate}', delete_agree = 'yes'`;
    const portfolio_id = `portfolio_id = '${portf_id}'`;

    if (portfolio_row[0][0]) {
      await pool.execute("CALL UpdatePortfolio(?,?)", [portfolioFieldsValues, portfolio_id]);

      if (goal_row[0]) {
        const goalFieldsValues = `g_trash = 'yes', g_trash_date = '${formattedDate}'`;
        await pool.execute("CALL UpdateGoals(?,?)", [goalFieldsValues, portfolio_id]);
        if (goal_row[0]) {
          const goal_array = goal_row[0];
          goal_array.forEach(async (row) => {
            const gid = `gid = '${row.gid}'`;
            await pool.execute("CALL UpdateGoalsInvitedMembers(?,?)", [goalFieldsValues, gid]);
            await pool.execute("CALL UpdateGoalsMembers(?,?)", [goalFieldsValues, gid]);
            await pool.execute("CALL UpdateGoalsSuggestedMembers(?,?)", [goalFieldsValues, gid]);
          });
        }
      }

      if (kpi_row[0]) {
        const kpiFieldsValues = `s_trash = 'yes', s_trash_date = '${formattedDate}'`;
        await pool.execute("CALL UpdateStrategies(?,?)", [kpiFieldsValues, portfolio_id]);
      }

      if (project_row[0]) {
        const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
        await pool.execute("CALL UpdateProject(?,?)", [projectFieldsValues, portfolio_id]);
        if (project_row[0]) {
          const project_array = project_row[0];
          project_array.forEach(async (row) => {
            const pid = `pid = '${row.pid}'`;
            await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectManagement(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectManagementFields(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectMembers(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [projectFieldsValues, pid]);
          });
        }
      }

      if (task_row[0]) {
        const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}'`;
        await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, portfolio_id]);
      }

      if (subtask_row[0]) {
        const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}'`;
        await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, portfolio_id]);
      }
      return res.status(200).json({ message: "Portfolio Moved to Trash Successfully." });
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
    const [goal_row] = await pool.execute("CALL file_itGoalDetail(?)", [goal_id]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    const goalParentFieldsValues = `g_trash = 'yes', g_trash_date = '${formattedDate}', gsingle_trash = 'yes'`;
    const goalFieldsValues = `g_trash = 'yes', g_trash_date = '${formattedDate}'`;
    const gid = `gid = '${goal_id}'`;

    if (goal_row[0][0]) {
      await pool.execute("CALL UpdateGoals(?,?)", [goalParentFieldsValues, gid]);
      await pool.execute("CALL UpdateGoalsInvitedMembers(?,?)", [goalFieldsValues, gid]);
      await pool.execute("CALL UpdateGoalsMembers(?,?)", [goalFieldsValues, gid]);
      await pool.execute("CALL UpdateGoalsSuggestedMembers(?,?)", [goalFieldsValues, gid]);

      const [goal_wise_kpis] = await pool.execute("CALL GoalsAllStrategiesList_not_in_trash(?)", [goal_id]);
      if (goal_wise_kpis[0]) {
        const kpi_array = goal_wise_kpis[0];
        kpi_array.forEach(async (row) => {
          const kpiFieldsValues = `s_trash = 'yes', s_trash_date = '${formattedDate}', s_single_trash = 'g_yes'`;
          const sid = `sid = '${row.sid}'`;
          await pool.execute("CALL UpdateStrategies(?,?)", [kpiFieldsValues, sid]);
          const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_not_in_trash(?)", [row.sid]);
          if (kpi_wise_projects[0]) {
            const project_array = kpi_wise_projects[0];
            project_array.forEach(async (row) => {
              const projectParentFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}', psingle_trash = 'g_yes'`;
              const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
              const pid = `pid = '${row.pid}'`;
              await pool.execute("CALL UpdateProject(?,?)", [projectParentFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectManagement(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectManagementFields(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectMembers(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [projectFieldsValues, pid]);

              const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}', tsingle_trash = 'g_yes'`;
              const tproject_assign = `tproject_assign = '${row.pid}'`;
              await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tproject_assign]);

              const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 'g_yes'`;
              const stproject_assign = `stproject_assign = '${row.pid}'`;
              await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stproject_assign]);
            });
          }
        });
      }
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const student = owner_row[0][0];

      const historyFieldsNames = "gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${goal_id}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Goal Moved To Trash By Goal Owner ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
      return res.status(200).json({ message: "Goal Moved To Trash Successfully." });
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
    const [kpi_row] = await pool.execute("CALL file_itStrategyDetail(?)", [strategy_id]);
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];
    if (kpi_row[0][0]) {
      const kpiFieldsValues = `s_trash = 'yes', s_trash_date = '${formattedDate}', s_single_trash = 'yes'`;
      const sid = `sid = '${strategy_id}'`;
      await pool.execute("CALL UpdateStrategies(?,?)", [kpiFieldsValues, sid]);
      const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_not_in_trash(?)", [strategy_id]);
      if (kpi_wise_projects[0]) {
        const project_array = kpi_wise_projects[0];
        project_array.forEach(async (row) => {
          const projectParentFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}', psingle_trash = 's_yes'`;
          const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
          const pid = `pid = '${row.pid}'`;
          await pool.execute("CALL UpdateProject(?,?)", [projectParentFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectManagement(?,?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectManagementFields(?,?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectMembers(?,?)", [projectFieldsValues, pid]);
          await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [projectFieldsValues, pid]);

          const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}', tsingle_trash = 's_yes'`;
          const tproject_assign = `tproject_assign = '${row.pid}'`;
          await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tproject_assign]);

          const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 's_yes'`;
          const stproject_assign = `stproject_assign = '${row.pid}'`;
          await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stproject_assign]);
        });
      }
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const student = owner_row[0][0];

      const historyFieldsNames = "sid, gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${strategy_id}", "${kpi_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "KPI Moved to Trash By KPI Owner ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
      return res.status(200).json({ message: "KPI Moved to Trash Successfully." });
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
    const [project_row] = await pool.execute("CALL file_itProjectDetail(?,?)", [project_id, user_id]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (project_row[0][0]) {
      const projectParentFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}', psingle_trash = 'yes'`;
      const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
      const pid = `pid = '${project_id}'`;
      await pool.execute("CALL UpdateProject(?,?)", [projectParentFieldsValues, pid]);
      await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, pid]);
      await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [projectFieldsValues, pid]);
      await pool.execute("CALL UpdateProjectManagement(?,?)", [projectFieldsValues, pid]);
      await pool.execute("CALL UpdateProjectManagementFields(?,?)", [projectFieldsValues, pid]);
      await pool.execute("CALL UpdateProjectMembers(?,?)", [projectFieldsValues, pid]);
      await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [projectFieldsValues, pid]);

      const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}', tsingle_trash = 'p_yes'`;
      const tproject_assign = `tproject_assign = '${project_id}'`;
      await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tproject_assign]);

      const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 'p_yes'`;
      const stproject_assign = `stproject_assign = '${project_id}'`;
      await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stproject_assign]);
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const student = owner_row[0][0];

      const historyFieldsNames = "pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Project Moved to Trash By Project Owner ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
      return res.status(200).json({ message: "Project Moved to Trash Successfully." });
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
    const [task_row] = await pool.execute("CALL file_itgetTaskById(?)", [task_id]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (task_row[0][0]) {
      const taskFieldsValues = `trash = 'yes', trash_date = '${formattedDate}', tstatus_date = '${dateConversion()}', tsingle_trash = 't_yes'`;
      const tid = `tid = '${task_id}'`;
      await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tid]);

      const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 't_yes'`;
      await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, tid]);
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const student = owner_row[0][0];

      const historyFieldsNames = "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_row[0][0].tcode} Task Moved to Trash By ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
      return res.status(200).json({ message: "Task Moved to Trash Successfully." });
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
    const [subtask_row] = await pool.execute("CALL file_itcheck_subtask(?)", [subtask_id]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (subtask_row[0][0]) {
      const subtaskFieldsValues = `strash = 'yes', strash_date = '${formattedDate}', ststatus_date = '${dateConversion()}', stsingle_trash = 'yes'`;
      const stid = `stid = '${subtask_id}'`;
      await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stid]);
      const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
      const student = owner_row[0][0];

      const historyFieldsNames = "subtask_id, task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].tid}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_row[0][0].stcode} Subtask Moved to Trash By ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
      return res.status(200).json({ message: "Subtask Moved to Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get Task details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Project File
router.patch("/trash/delete/project-file/:project_id/:pfile_id/:user_id", async (req, res) => {
  const { project_id, pfile_id, user_id } = req.params;
  try {
    const [project_file_row] = await pool.execute("CALL pfile_detailfile_it(?)", [pfile_id]);
    const [project_row] = await pool.execute("CALL file_itgetProjectById(?)", [project_id]);

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

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
          project_row[0][0].sid}", "${project_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${project_file} Moved to Trash By Project Owner ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [
          historyFieldsNames,
          historyFieldsValues,
        ]);

        const projectFieldsValues = `ptrash = 'yes', ptrash_date = '${formattedDate}'`;
        const file_id = `pfile_id = '${pfile_id}'`;
        await pool.execute("CALL UpdateProjectFiles(?,?)", [
          projectFieldsValues,
          file_id,
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
router.patch("/trash/delete/task-file/:task_id/:task_file_name/:user_id", async (req, res) => {
  const { task_id, task_file_name, user_id } = req.params;
  try {
    const [task_row] = await pool.execute("CALL file_itgetTaskById(?)", [task_id]);

    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (task_row[0][0]) {
      const trimmedTfile = task_file_name.trim();
      const indexOfUnderscore = trimmedTfile.indexOf("_");
      const task_file = trimmedTfile.substr(indexOfUnderscore + 1);

      const historyFieldsNames = "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_file} Moved to Trash By ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);

      const taskTrashFieldsNames = "pid, tid, tfile, task_trash, task_trash_date";
      const taskTrashFieldsValues = `"${task_row[0][0].tproject_assign}", "${task_row[0][0].tid}", "${task_file_name}", "yes", "${formattedDate}"`;

      await pool.execute("CALL InsertTaskTrash(?,?)", [taskTrashFieldsNames, taskTrashFieldsValues]);

      const tfile_string = task_row[0][0].tfile;
      const tfile_array = tfile_string.split(",");
      const new_tfile_array = tfile_array.filter((obj) => obj !== task_file_name);
      const new_tfile_string = new_tfile_array.join(",");

      const taskFieldsValues = `tfile = '${new_tfile_string}'`;
      const tid = `tid = '${task_id}'`;
      await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tid]);

      return res.status(200).json({ message: "Task File Moved to Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get Task File details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Subtask File
router.patch("/trash/delete/subtask-file/:subtask_id/:subtask_file_name/:user_id", async (req, res) => {
  const { subtask_id, subtask_file_name, user_id } = req.params;
  try {
    const [subtask_row] = await pool.execute("CALL getSubtaskById(?)", [subtask_id]);

    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (subtask_row[0][0]) {
      const trimmedTfile = subtask_file_name.trim();
      const indexOfUnderscore = trimmedTfile.indexOf("_");
      const subtask_file = trimmedTfile.substr(indexOfUnderscore + 1);

      const historyFieldsNames = "subtask_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
      const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_file} Moved to Trash By ${student.first_name} ${student.last_name}"`;

      await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);

        const subtaskTrashFieldsNames = "pid, stid, tid, stfile, stask_trash, stask_trash_date";
        const subtaskTrashFieldsValues = `"${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].stid}", "${subtask_row[0][0].tid}", "${subtask_file_name}", "yes", "${formattedDate}"`;

      await pool.execute("CALL InsertSubtaskTrash(?,?)", [subtaskTrashFieldsNames, subtaskTrashFieldsValues]);

      const stfile_string = subtask_row[0][0].stfile;
      const stfile_array = stfile_string.split(",");
      const new_stfile_array = stfile_array.filter((obj) => obj !== subtask_file_name);
      const new_stfile_string = new_stfile_array.join(",");

      const subtaskFieldsValues = `stfile = '${new_stfile_string}'`;
      const stid = `stid = '${subtask_id}'`;
      await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stid]);

      return res.status(200).json({ message: "Subtask File Moved to Trash Successfully." });
    } else {
      res.status(400).json({ error: "Failed to get Subtask File details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Portfolio
router.patch("/trash/retrieve/portfolio/:portf_id/:user_id", async (req, res) => {
  const { portf_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (moment(student.package_expiry, format, true).isValid()) {
      const expiryDate = new Date(student.package_expiry);
      const currentDate = new Date();
      if (expiryDate <= currentDate) {
        res.status(400).json({ error: "Package Expired." });
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [portfolio_count] = await pool.execute("CALL getPortfolioCount(?)", [user_id]);
        if (package[0][0]) {
          const total_portfolios = package[0][0].pack_portfolios;
          const used_portfolios = portfolio_count[0][0].portfolio_count_rows;
          const check_type = !isNaN(total_portfolios);
          if (check_type) {
            if (used_portfolios < total_portfolios) {
              if (portf_id) {
                var limitation = "in_limit";
              }
            } else {
              res.status(400).json({ error: "Limit Exceeds." });
            }
          } else {
            if (portf_id) {
              var limitation = "in_limit";
            }
          }
        } else {
          res.status(400).json({ error: "Package Expired." });
        }
      }
    } else {
      const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
      const [portfolio_count] = await pool.execute("CALL getPortfolioCount(?)", [user_id]);
      if (package[0][0]) {
        const total_portfolios = package[0][0].pack_portfolios;
        const used_portfolios = portfolio_count[0][0].portfolio_count_rows;
        const check_type = !isNaN(total_portfolios);
        if (check_type) {
          if (used_portfolios < total_portfolios) {
            if (portf_id) {
              var limitation = "in_limit";
            }
          } else {
            res.status(400).json({ error: "Limit Exceeds." });
          }
        } else {
          if (portf_id) {
            var limitation = "in_limit";
          }
        }
      } else {
        res.status(400).json({ error: "Package Expired." });
      }
    }
    if (limitation == "in_limit") {
      const [portfolio_row] = await pool.execute("CALL getPortfolio(?,?)", [portf_id, user_id]);

      const [project_row] = await pool.execute("CALL portfolio_projectsRetriveTrash(?)", [portf_id]);

      if (portfolio_row[0][0]) {
        const portfolioFieldsValues = `portfolio_trash = '', portfolio_trash_date = '', delete_agree = ''`;
        const portfolio_id = `portfolio_id = '${portf_id}'`;
        await pool.execute("CALL UpdatePortfolio(?,?)", [portfolioFieldsValues, portfolio_id]);

        const goalFieldsValues = `g_trash = '', g_trash_date = ''`;
        await pool.execute("CALL UpdateGoals(?,?)", [goalFieldsValues, portfolio_id]);

        const kpiFieldsValues = `s_trash = '', s_trash_date = ''`;
        await pool.execute("CALL UpdateStrategies(?,?)", [kpiFieldsValues, portfolio_id]);

        if (project_row[0]) {
          const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
          await pool.execute("CALL UpdateProject(?,?)", [projectFieldsValues, portfolio_id]);
          if (project_row[0]) {
            const project_array = project_row[0];
            project_array.forEach(async (row) => {
              const pid = `pid = '${row.pid}'`;
              await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectManagement(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectManagementFields(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectMembers(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [projectFieldsValues, pid]);
            });
          }
        }

        const taskFieldsValues = `trash = '', trash_date = '', tstatus_date = '${dateConversion()}'`;
        await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, portfolio_id]);

        const subtaskFieldsValues = `strash = '', strash_date = '', ststatus_date = '${dateConversion()}'`;
        await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, portfolio_id]);

        return res.status(200).json({ message: "Portfolio Restored Successfully." });
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
});

// Reopen Goal
router.patch("/trash/retrieve/goal/:goal_id/:portfolio_id/:user_id", async (req, res) => {
  const { goal_id, portfolio_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (moment(student.package_expiry, format, true).isValid()) {
      const expiryDate = new Date(student.package_expiry);
      const currentDate = new Date();
      if (expiryDate <= currentDate) {
        res.status(400).json({ error: "Package Expired." });
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [goal_count] = await pool.execute("CALL getGoalCount(?,?)", [user_id, portfolio_id]);
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
      const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
      const [goal_count] = await pool.execute("CALL getGoalCount(?,?)", [user_id, portfolio_id]);
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
      const [goal_row] = await pool.execute("CALL check_goal_trash(?,?)", [user_id, goal_id]);

      if (goal_row[0][0]) {
        const [portfolio_row] = await pool.execute("CALL checkProjectPorfolioTrash(?)", [goal_row[0][0].portfolio_id]);
        if (portfolio_row[0][0]) {
          res.status(400).json({
            error: "Portfolio is in Trash! To Restore Goal please Restore Portfolio.",
          });
        } else {
          const goalParentFieldsValues = `g_trash = '', g_trash_date = '', gsingle_trash = ''`;
          const goalFieldsValues = `g_trash = '', g_trash_date = ''`;
          const gid = `gid = '${goal_id}'`;
          await pool.execute("CALL UpdateGoals(?,?)", [goalParentFieldsValues, gid]);
          await pool.execute("CALL UpdateGoalsInvitedMembers(?,?)", [goalFieldsValues, gid]);
          await pool.execute("CALL UpdateGoalsMembers(?,?)", [goalFieldsValues, gid]);
          await pool.execute("CALL UpdateGoalsSuggestedMembers(?,?)", [goalFieldsValues, gid]);

          const [goal_wise_kpis] = await pool.execute("CALL GoalsAllStrategiesList_in_trash(?)", [goal_id]);
          if (goal_wise_kpis[0]) {
            const kpi_array = goal_wise_kpis[0];
            kpi_array.forEach(async (row) => {
              const kpiFieldsValues = `s_trash = '', s_trash_date = '', s_single_trash = ''`;
              const sid = `sid = '${row.sid}'`;
              await pool.execute("CALL UpdateStrategies(?,?)", [kpiFieldsValues, sid]);

              const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_in_trash(?)", [row.sid]);
              if (kpi_wise_projects[0]) {
                const project_array = kpi_wise_projects[0];
                project_array.forEach(async (row) => {
                  const projectParentFieldsValues = `ptrash = '', ptrash_date = '', psingle_trash = ''`;
                  const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
                  const pid = `pid = '${row.pid}'`;
                  await pool.execute("CALL UpdateProject(?,?)", [projectParentFieldsValues, pid]);
                  await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, pid]);
                  await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [projectFieldsValues, pid]);
                  await pool.execute("CALL UpdateProjectManagement(?,?)", [projectFieldsValues, pid]);
                  await pool.execute("CALL UpdateProjectManagementFields(?,?)", [projectFieldsValues, pid]);
                  await pool.execute("CALL UpdateProjectMembers(?,?)", [projectFieldsValues, pid]);
                  await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [projectFieldsValues, pid]);

                  const taskFieldsValues = `trash = '', trash_date = '', tsingle_trash = ''`;
                  const tproject_assign = `tproject_assign = '${row.pid}'`;
                  await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tproject_assign]);

                  const subtaskFieldsValues = `strash = '', strash_date = '', stsingle_trash = ''`;
                  const stproject_assign = `stproject_assign = '${row.pid}'`;
                  await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stproject_assign]);
                });
              }
            });
          }

          const historyFieldsNames = "gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${goal_id}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Goal Restored By ${student.first_name} ${student.last_name}"`;

          await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
          return res.status(200).json({ message: "Goal Restored Successfully." });
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
});

// Reopen KPI
router.patch("/trash/retrieve/kpi/:strategy_id/:portfolio_id/:user_id", async (req, res) => {
  const { strategy_id, portfolio_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const [kpi] = await pool.execute("CALL StrategyDetailGid(?)", [strategy_id]);
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (moment(student.package_expiry, format, true).isValid()) {
      const expiryDate = new Date(student.package_expiry);
      const currentDate = new Date();
      if (expiryDate <= currentDate) {
        res.status(400).json({ error: "Package Expired." });
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [kpi_count] = await pool.execute("CALL getStrategiesCount(?,?,?)", [user_id, kpi[0][0].gid, portfolio_id]);
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
      const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
      const [kpi_count] = await pool.execute("CALL getStrategiesCount(?,?,?)", [user_id, kpi.gid, portfolio_id]);
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
      const [kpi_row] = await pool.execute("CALL check_strategy_trash(?,?)", [user_id, strategy_id]);
      if (kpi_row[0][0]) {
        const [goal_row] = await pool.execute("CALL checkStrategyGoalTrash(?)", [kpi_row[0][0].gid]);
        if (goal_row[0][0]) {
          res.status(400).json({
            error: "Goal is in Trash! To Restore KPI please Restore Goal.",
          });
        } else {
          const kpiFieldsValues = `s_trash = '', s_trash_date = '', s_single_trash = ''`;
          const sid = `sid = '${strategy_id}'`;
          await pool.execute("CALL UpdateStrategies(?,?)", [kpiFieldsValues, sid]);

          const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_in_trash_strategybulk(?)", [strategy_id]);
          if (kpi_wise_projects[0]) {
            const project_array = kpi_wise_projects[0];
            project_array.forEach(async (row) => {
              const projectParentFieldsValues = `ptrash = '', ptrash_date = '', psingle_trash = ''`;
              const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
              const pid = `pid = '${row.pid}'`;
              await pool.execute("CALL UpdateProject(?,?)", [projectParentFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectManagement(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectManagementFields(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectMembers(?,?)", [projectFieldsValues, pid]);
              await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [projectFieldsValues, pid]);

              const taskFieldsValues = `trash = '', trash_date = '', tsingle_trash = ''`;
              const tproject_assign = `tproject_assign = '${row.pid}'`;
              await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tproject_assign]);

              const subtaskFieldsValues = `strash = '', strash_date = '', stsingle_trash = ''`;
              const stproject_assign = `stproject_assign = '${row.pid}'`;
              await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stproject_assign]);
            });
          }

          const historyFieldsNames = "sid, gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${strategy_id}", "${kpi_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "KPI Restored By ${student.first_name} ${student.last_name}"`;

          await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
          return res.status(200).json({ message: "KPI Restored Successfully." });
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
});

// Reopen Project
router.patch("/trash/retrieve/project/:project_id/:portfolio_id/:user_id", async (req, res) => {
  const { project_id, portfolio_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const [project] = await pool.execute("CALL getProjectDetailID(?)", [project_id]);
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
          const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
          const [project_count] = await pool.execute("CALL getProjectCount(?,?)", [user_id, portfolio_id]);
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
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [project_count] = await pool.execute("CALL getProjectCount(?,?)", [user_id, portfolio_id]);
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
      const [project_row] = await pool.execute("CALL check_project_trash(?,?)", [project_id, user_id]);
      if (project_row[0][0]) {
        const [portfolio_row] = await pool.execute("CALL checkProjectPorfolioTrash(?)", [project_row[0][0].portfolio_id]);
        if (portfolio_row[0][0]) {
          res.status(400).json({
            error: "Portfolio is in Trash! To Restore Project please Restore Portfolio.",
          });
        } else {
          const [kpi_row] = await pool.execute("CALL checkProjectStrategyTrash(?)", [project_row[0][0].sid]);
          if (kpi_row[0][0]) {
            res.status(400).json({
              error: "KPI is in Trash! To Restore Project please Restore KPI.",
            });
          } else {
            const projectParentFieldsValues = `ptrash = '', ptrash_date = '', psingle_trash = ''`;
            const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
            const pid = `pid = '${project_id}'`;
            await pool.execute("CALL UpdateProject(?,?)", [projectParentFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectInvitedMembers(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectManagement(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectManagementFields(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectMembers(?,?)", [projectFieldsValues, pid]);
            await pool.execute("CALL UpdateProjectSuggestedMembers(?,?)", [projectFieldsValues, pid]);

            const taskFieldsValues = `trash = '', trash_date = '', tsingle_trash = ''`;
            const tproject_assign = `tproject_assign = '${project_id}'`;
            await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tproject_assign]);

            const subtaskFieldsValues = `strash = '', strash_date = '', stsingle_trash = ''`;
            const stproject_assign = `stproject_assign = '${project_id}'`;
            await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stproject_assign]);

            const historyFieldsNames = "pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
            const historyFieldsValues = `"${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "Project Restored By ${student.first_name} ${student.last_name}"`;

            await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
            return res.status(200).json({ message: "Project Restored Successfully." });
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
});

// Reopen Task
router.patch("/trash/retrieve/task/:task_id/:portfolio_id/:user_id", async (req, res) => {
  const { task_id, portfolio_id, user_id } = req.params;
  try {
    var limitation = "";
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const formattedDate = dateConversion();
    const format = "Y-MM-DD H:m:s";
    if (moment(student.package_expiry, format, true).isValid()) {
      const expiryDate = new Date(student.package_expiry);
      const currentDate = new Date();
      if (expiryDate <= currentDate) {
        res.status(400).json({ error: "Package Expired." });
      } else {
        const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
        const [task_count] = await pool.execute("CALL getTaskCount(?,?)", [user_id, portfolio_id]);
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
      const [package] = await pool.execute("CALL getPackDetail(?)", [student.package_id]);
      const [task_count] = await pool.execute("CALL getTaskCount(?,?)", [user_id, portfolio_id]);
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
        const [project_row] = await pool.execute("CALL checkTaskProjectTrash(?)", [task_row[0][0].tproject_assign]);
        if (project_row[0][0]) {
          res.status(400).json({
            error: "Project is in Trash! To Restore Task please Restore Project.",
          });
        } else {
          const taskFieldsValues = `trash = '', trash_date = '', tstatus_date = '${formattedDate}', tsingle_trash = ''`;
          const tid = `tid = '${task_id}'`;
          await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tid]);

          const subtaskFieldsValues = `strash = '', strash_date = '', ststatus_date = '${formattedDate}', stsingle_trash = ''`;
          await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, tid]);

          const historyFieldsNames = "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
          const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_row[0][0].tcode} Task Restored By ${student.first_name} ${student.last_name}"`;

          await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
          return res.status(200).json({ message: "Task Restored Successfully." });
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
});

// Reopen Subtask
router.patch("/trash/retrieve/subtask/:subtask_id/:user_id", async (req, res) => {
  const { subtask_id, user_id } = req.params;
  try {
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const formattedDate = dateConversion();
    const [subtask_row] = await pool.execute("CALL check_subtask2(?)", [subtask_id]);
    if (subtask_row[0][0]) {
      const [task_row] = await pool.execute("CALL checkFileTaskTrash(?)", [subtask_row[0][0].tid]);
      if (task_row[0][0]) {
        res.status(400).json({
          error: "Task is in Trash! To Restore Subtask please Restore Task.",
        });
      } else {
        const subtaskFieldsValues = `strash = '', strash_date = '', ststatus_date = '${formattedDate}', stsingle_trash = ''`;
        const stid = `stid = '${subtask_id}'`;
        await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stid]);

        const historyFieldsNames = "subtask_id, task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].tid}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_row[0][0].stcode} Subtask Restored By ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
        return res.status(200).json({ message: "Subtask Restored Successfully." });
      }
    } else {
      res.status(400).json({ error: "Failed to get Subtask details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Project File
router.patch("/trash/retrieve/project-file/:project_id/:pfile_id/:user_id", async (req, res) => {
  const { project_id, pfile_id, user_id } = req.params;
  try {
    const [project_file_row] = await pool.execute("CALL check_pfile_trash(?)", [pfile_id]);
    const [project_trash] = await pool.execute("CALL checkTaskProjectTrash(?)", [project_id]);
    if (project_trash[0][0]) {
      res.status(400).json({
        error: "Project is in Trash! To Restore File please Restore Project.",
      });
    } else {
      const projectFieldsValues = `ptrash = '', ptrash_date = ''`;
      const file_id = `pfile_id = '${pfile_id}'`;
      await pool.execute("CALL UpdateProjectFiles(?,?)", [projectFieldsValues, file_id]);

      const [project_row] = await pool.execute("CALL file_itgetProjectById(?)", [project_id]);

      if (project_row[0][0]) {
        const pfile = project_file_row[0][0].pfile;
        const trimmedPfile = pfile.trim();
        const indexOfUnderscore = trimmedPfile.indexOf("_");
        const project_file = trimmedPfile.substr(indexOfUnderscore + 1);

        const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
        const student = owner_row[0][0];

        const historyFieldsNames = "pfile_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${pfile_id}", "${project_id}", "${project_row[0][0].sid}", "${project_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${project_file} Restored By ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);
        return res.status(200).json({ message: "Project File Restored Successfully." });
      } else {
        res.status(400).json({ error: "Failed to get Project details." });
      }
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Task File
router.patch("/trash/retrieve/task-file/:task_id/:tfile/:trash_id/:user_id", async (req, res) => {
  const { task_id, tfile, trash_id, user_id } = req.params;
  try {
    const [task_row] = await pool.execute("CALL file_itgetTaskById(?)", [task_id]);
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const [trash_row] = await pool.execute("CALL checkFileTaskTrash(?)", [trash_id]);
    if (trash_row[0][0]) {
      res.status(400).json({
        error: "Task is in Trash! To Restore File please Restore Task.",
      });
    } else {
      if (task_row[0][0]) {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + 1);
        const formattedDate = currentDate.toISOString().split("T")[0];

        const trimmedTfile = tfile.trim();
        const indexOfUnderscore = trimmedTfile.indexOf("_");
        const task_file = trimmedTfile.substr(indexOfUnderscore + 1);

        const historyFieldsNames = "task_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${task_id}", "${task_row[0][0].tproject_assign}", "${task_row[0][0].sid}", "${task_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${task_file} Restored By ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);

        let tfile_restore = "";

        if (task_row[0][0].tfile && task_row[0][0].tfile.trim() !== "") {
          const exist_tfile = task_row[0][0].tfile;

          // Split existing tfile and new tfile into arrays
          const exist_tfile_array = exist_tfile.split(", ");
          const tfile_new_array = tfile.split(", ");

          // Merge arrays
          const merge_tfile = [...exist_tfile_array, ...tfile_new_array];

          // Join the merged array into a string
          tfile_restore = merge_tfile.join(",");
        } else {
          tfile_restore = tfile; // Replace with the new tfile string
        }

        const taskFieldsValues = `tfile = '${tfile_restore}'`;
        const tid = `tid = '${task_id}'`;
        await pool.execute("CALL UpdateTask(?,?)", [taskFieldsValues, tid]);
        await pool.execute("CALL DeleteTaskTrash(?)", [`trash_id = '${trash_id}'`]);

        return res.status(200).json({ message: "Task Restored Successfully." });
      } else {
        res.status(400).json({ error: "Failed to get Task File details." });
      }
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reopen Subtask File
router.patch("/trash/retrieve/subtask-file/:subtask_id/:stfile/:trash_id/:user_id", async (req, res) => {
  const { subtask_id, stfile, trash_id, user_id } = req.params;
  try {
    const [subtask_row] = await pool.execute("CALL getSubtaskById(?)", [subtask_id]);
    const [owner_row] = await pool.execute("CALL getStudentById(?)", [user_id]);
    const student = owner_row[0][0];
    const [trash_row] = await pool.execute("CALL checkFileSubtaskTrash(?)", [trash_id]);
    if (trash_row[0][0]) {
      res.status(400).json({
        error: "Subtask is in Trash! To Restore File please Restore Subtask.",
      });
    } else {
      if (subtask_row[0][0]) {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + 1);
        const formattedDate = currentDate.toISOString().split("T")[0];

        const trimmedTfile = stfile.trim();
        const indexOfUnderscore = trimmedTfile.indexOf("_");
        const subtask_file = trimmedTfile.substr(indexOfUnderscore + 1);

        const historyFieldsNames = "subtask_id, pid, sid, gid, h_date, h_resource_id, h_resource, h_description";
        const historyFieldsValues = `"${subtask_id}", "${subtask_row[0][0].stproject_assign}", "${subtask_row[0][0].sid}", "${subtask_row[0][0].gid}", "${dateConversion()}", "${student.reg_id}", "${student.first_name} ${student.last_name}", "${subtask_file} Restored By ${student.first_name} ${student.last_name}"`;

        await pool.execute("CALL InsertProjectHistory(?,?)", [historyFieldsNames, historyFieldsValues]);

        let stfile_restore = "";

        if (subtask_row[0][0].stfile && subtask_row[0][0].stfile.trim() !== "") {
          const exist_stfile = subtask_row[0][0].stfile;

          // Split existing tfile and new tfile into arrays
          const exist_stfile_array = exist_stfile.split(", ");
          const stfile_new_array = stfile.split(", ");

          // Merge arrays
          const merge_stfile = [...exist_stfile_array, ...stfile_new_array];

          // Join the merged array into a string
          stfile_restore = merge_stfile.join(",");
        } else {
          stfile_restore = stfile; // Replace with the new tfile string
        }

        const subtaskFieldsValues = `stfile = '${stfile_restore}'`;
        const stid = `stid = '${subtask_id}'`;
        await pool.execute("CALL UpdateSubtask(?,?)", [subtaskFieldsValues, stid]);

        await pool.execute("CALL DeleteSubtaskTrash(?)", [`strash_id = '${trash_id}'`]);

        return res.status(200).json({ message: "Subtask Restored Successfully." });
      } else {
        res.status(400).json({ error: "Failed to get Task File details." });
      }
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Forever Goal
router.patch("/trash/delete-forever/goal/:gid/:user_id", async (req, res) => {
  const { gid, user_id } = req.params;
  try {
    const [goal_row] = await pool.execute("CALL check_goal_trash(?,?)", [user_id, gid]);

    if (goal_row[0][0]) {
      const [goal_wise_kpis] = await pool.execute("CALL GoalsAllStrategiesList_to_delete(?)", [gid]);
      if (goal_wise_kpis[0]) {
        const kpi_array = goal_wise_kpis[0];
        kpi_array.forEach(async (row) => {
          const sid = row.sid;
          const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_to_delete(?)", [sid]);
          if (kpi_wise_projects[0]) {
            const project_array = kpi_wise_projects[0];
            project_array.forEach(async (row) => {
              const pid = row.pid;
              const [tasks] = await pool.execute("CALL getProjectAllTaskTrash(?)", [pid]);
              if (tasks[0]) {
                const task_array = tasks[0];
                task_array.forEach(async (row) => {
                  const tid = row.tid;
                  await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${tid}'`]);
                });
                await pool.execute("CALL DeleteTask(?)", [`tproject_assign = '${pid}'`]);
              }
              const [subtasks] = await pool.execute("CALL getProjectAllSubtaskTrash(?)", [pid]);
              if (subtasks[0]) {
                const subtask_array = subtasks[0];
                subtask_array.forEach(async (row) => {
                  const stid = row.stid;
                  await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${stid}'`]);
                });
                await pool.execute("CALL DeleteSubtask(?)", [`stproject_assign = '${pid}'`]);
              }

              await pool.execute("CALL DeleteProjectFiles(?)", [`pid = '${pid}'`]);
              await pool.execute("CALL DeleteProjectInvitedMembers(?)", [`pid = '${pid}'`]);
              await pool.execute("CALL DeleteProjectManagement(?)", [`pid = '${pid}'`]);
              await pool.execute("CALL DeleteProjectManagementFields(?)", [`pid = '${pid}'`]);
              await pool.execute("CALL DeleteProjectMembers(?)", [`pid = '${pid}'`]);
              await pool.execute("CALL DeleteProjectSuggestedMembers(?)", [`pid = '${pid}'`]);
              await pool.execute("CALL DeleteProjectHistory(?)", [`pid = '${pid}'`]);
              await pool.execute("CALL DeleteProjectRequestMember(?)", [`pid = '${pid}'`]);
              await pool.execute("CALL DeleteProject(?)", [`pid = '${pid}'`]);
            });
          }
          await pool.execute("CALL DeleteStrategies(?)", [`sid = '${sid}'`]);
        });
      }
      await pool.execute("CALL DeleteGoals(?)", [`gid = '${gid}'`]);
      return res.status(200).json({ message: "Goal deleted permanently" });
    } else {
      res.status(400).json({ error: "Failed to get Goal details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Forever KPI
router.patch("/trash/delete-forever/kpi/:sid/:user_id", async (req, res) => {
  const { sid, user_id } = req.params;
  try {
    const [kpi_row] = await pool.execute("CALL check_strategy_trash(?,?)", [user_id, sid]);

    if (kpi_row[0][0]) {
      const [kpi_wise_projects] = await pool.execute("CALL StrategyAllProjectsList_to_delete(?)", [sid]);
      if (kpi_wise_projects[0]) {
        const project_array = kpi_wise_projects[0];
        project_array.forEach(async (row) => {
          const pid = row.pid;
          const [tasks] = await pool.execute("CALL getProjectAllTaskTrash(?)", [pid]);
          if (tasks[0]) {
            const task_array = tasks[0];
            task_array.forEach(async (row) => {
              const tid = row.tid;
              await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${tid}'`]);
            });
            await pool.execute("CALL DeleteTask(?)", [`tproject_assign = '${pid}'`]);
          }
          const [subtasks] = await pool.execute("CALL getProjectAllSubtaskTrash(?)", [pid]);
          if (subtasks[0]) {
            const subtask_array = subtasks[0];
            subtask_array.forEach(async (row) => {
              const stid = row.stid;
              await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${stid}'`]);
            });
            await pool.execute("CALL DeleteSubtask(?)", [`stproject_assign = '${pid}'`]);
          }

          await pool.execute("CALL DeleteProjectFiles(?)", [`pid = '${pid}'`]);
          await pool.execute("CALL DeleteProjectInvitedMembers(?)", [`pid = '${pid}'`]);
          await pool.execute("CALL DeleteProjectManagement(?)", [`pid = '${pid}'`]);
          await pool.execute("CALL DeleteProjectManagementFields(?)", [`pid = '${pid}'`]);
          await pool.execute("CALL DeleteProjectMembers(?)", [`pid = '${pid}'`]);
          await pool.execute("CALL DeleteProjectSuggestedMembers(?)", [`pid = '${pid}'`]);
          await pool.execute("CALL DeleteProjectHistory(?)", [`pid = '${pid}'`]);
          await pool.execute("CALL DeleteProjectRequestMember(?)", [`pid = '${pid}'`]);
          await pool.execute("CALL DeleteProject(?)", [`pid = '${pid}'`]);
        });
      }
      await pool.execute("CALL DeleteStrategies(?)", [`sid = '${sid}'`]);
      return res.status(200).json({ message: "KPI deleted permanently" });
    } else {
      res.status(400).json({ error: "Failed to get KPI details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Forever Project
router.patch("/trash/delete-forever/project/:pid/:user_id", async (req, res) => {
  const { pid, user_id } = req.params;
  try {
    const [project_row] = await pool.execute("CALL check_project_trash(?,?)", [pid, user_id]);

    if (project_row[0][0]) {
      const [tasks] = await pool.execute("CALL getProjectAllTaskTrash(?)", [pid]);
      if (tasks[0]) {
        const task_array = tasks[0];
        task_array.forEach(async (row) => {
          const tid = row.tid;
          await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${tid}'`]);
        });
        await pool.execute("CALL DeleteTask(?)", [`tproject_assign = '${pid}'`]);
      }
      const [subtasks] = await pool.execute("CALL getProjectAllSubtaskTrash(?)", [pid]);
      if (subtasks[0]) {
        const subtask_array = subtasks[0];
        subtask_array.forEach(async (row) => {
          const stid = row.stid;
          await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${stid}'`]);
        });
        await pool.execute("CALL DeleteSubtask(?)", [`stproject_assign = '${pid}'`]);
      }

      await pool.execute("CALL DeleteProjectFiles(?)", [`pid = '${pid}'`]);
      await pool.execute("CALL DeleteProjectInvitedMembers(?)", [`pid = '${pid}'`]);
      await pool.execute("CALL DeleteProjectManagement(?)", [`pid = '${pid}'`]);
      await pool.execute("CALL DeleteProjectManagementFields(?)", [`pid = '${pid}'`]);
      await pool.execute("CALL DeleteProjectMembers(?)", [`pid = '${pid}'`]);
      await pool.execute("CALL DeleteProjectSuggestedMembers(?)", [`pid = '${pid}'`]);
      await pool.execute("CALL DeleteProjectHistory(?)", [`pid = '${pid}'`]);
      await pool.execute("CALL DeleteProjectRequestMember(?)", [`pid = '${pid}'`]);
      await pool.execute("CALL DeleteProject(?)", [`pid = '${pid}'`]);
      return res.status(200).json({ message: "Project deleted permanently" });
    } else {
      res.status(400).json({ error: "Failed to get Project details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Forever Task
router.patch("/trash/delete-forever/task/:tid", async (req, res) => {
  const { tid } = req.params;
  try {
    const [task_row] = await pool.execute("CALL check_task2_new(?)", [tid]);

    if (task_row[0][0]) {
      await pool.execute("CALL DeleteSubtask(?)", [`tid = '${tid}'`]);
      await pool.execute("CALL DeleteSubtaskTrash(?)", [`tid = '${tid}'`]);
      await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${tid}'`]);
      await pool.execute("CALL DeleteTask(?)", [`tid = '${tid}'`]);
      return res.status(200).json({ message: "Task deleted permanently" });
    } else {
      res.status(400).json({ error: "Failed to get Task details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Forever Subtask
router.patch("/trash/delete-forever/subtask/:stid", async (req, res) => {
  const { stid } = req.params;
  try {
    const [task_row] = await pool.execute("CALL check_subtask2(?)", [stid]);

    if (task_row[0][0]) {
      await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${stid}'`]);
      await pool.execute("CALL DeleteSubtask(?)", [`stid = '${stid}'`]);
      return res.status(200).json({ message: "Subtask deleted permanently" });
    } else {
      res.status(400).json({ error: "Failed to get Subtask details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Forever Project File
router.patch("/trash/delete-forever/project-file/:pfile_id", async (req, res) => {
  const { pfile_id } = req.params;
  try {
    const [file_row] = await pool.execute("CALL check_pfile_trash(?)", [pfile_id]);

    if (file_row[0][0]) {
      await pool.execute("CALL DeleteProjectFiles(?)", [`pfile_id = '${pfile_id}'`]);
      return res.status(200).json({ message: "Project File deleted permanently" });
    } else {
      res.status(400).json({ error: "Failed to get Project File details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Forever Task File
router.patch("/trash/delete-forever/task-file/:task_id/:trash_id/:user_id", async (req, res) => {
  const { task_id, trash_id, user_id } = req.params;
  try {
    const [trash_row] = await pool.execute("CALL check_tfile_task_trash(?,?)", [trash_id, task_id]);

    if (trash_row[0][0]) {
      await pool.execute("CALL DeleteTaskTrash(?)", [`trash_id = '${trash_id}'`]);
      return res.status(200).json({ message: "Task File deleted permanently" });
    } else {
      res.status(400).json({ error: "Failed to get Task File details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Forever Subtask File
router.patch("/trash/delete-forever/subtask-file/:subtask_id/:strash_id/:user_id", async (req, res) => {
  const { subtask_id, strash_id, user_id } = req.params;
  try {
    const [trash_row] = await pool.execute("CALL check_stfile_subtask_trash(?,?)", [strash_id, subtask_id]);

    if (trash_row[0][0]) {
      await pool.execute("CALL DeleteSubtaskTrash(?)", [`strash_id = '${strash_id}'`]);
      return res.status(200).json({ message: "Subtask File deleted permanently" });
    } else {
      res.status(400).json({ error: "Failed to get Subtask File details." });
    }
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete All Trash after 30 days
router.get("/trash/delete-all", async (req, res) => {
  try {
    const currentDate = moment().format("YYYY-MM-DD");
    const [portfolio_row] = await pool.execute("CALL get_portfolio_trash_date(?)", [currentDate]);
    const [goal_row] = await pool.execute("CALL get_goal_trash_date(?)", [currentDate]);
    const [strategy_row] = await pool.execute("CALL get_strategies_trash_date(?)", [currentDate]);
    const [project_row] = await pool.execute("CALL get_project_trash_date(?)", [currentDate]);
    const [task_row] = await pool.execute("CALL get_task_trash_date(?)", [currentDate]);
    const [subtask_row] = await pool.execute("CALL get_subtask_trash_date(?)", [currentDate]);
    const [projectFile_row] = await pool.execute("CALL get_pfile_trash(?)", [currentDate]);
    const [taskFile_row] = await pool.execute("CALL get_tfile_trash(?)", [currentDate]);
    const [subtaskFile_row] = await pool.execute("CALL get_stfile_trash(?)", [currentDate]);

    const portfolio_trash = portfolio_row[0];
    const goal_trash = goal_row[0];
    const strategy_trash = strategy_row[0];
    const project_trash = project_row[0];
    const task_trash = task_row[0];
    const subtask_trash = subtask_row[0];
    const projectFile_trash = projectFile_row[0];
    const taskFile_trash = taskFile_row[0];
    const subtaskFile_trash = subtaskFile_row[0];

    portfolio_trash?.map(async (pf) => {
      const portfolioId = pf.portfolio_id; 
      const [rows1] = await pool.execute("CALL portfolio_goalsTrash(?)", [portfolioId]);
      const [rows2] = await pool.execute("CALL portfolio_strategiesTrash(?)", [portfolioId]);
      const [rows3] = await pool.execute("CALL get_PortfolioAllDepartment(?)", [portfolioId]);
      const [rows4] = await pool.execute("CALL portfolio_projectsTrash(?)", [portfolioId]);
      const [rows5] = await pool.execute("CALL getPortfolioAllTaskTrash(?)", [portfolioId]);
      const [rows6] = await pool.execute("CALL getPortfolioAllSubtaskTrash(?)", [portfolioId]);
      if(rows1[0]){
        await pool.execute("CALL DeleteGoals(?)", [`portfolio_id = '${portfolioId}'`]);
      }
      if(rows2[0]){
        await pool.execute("CALL DeleteStrategies(?)", [`portfolio_id = '${portfolioId}'`]);
      }
      if(rows3[0]){
        await pool.execute("CALL DeleteProjectPortfolioDepartment(?)", [`portfolio_id = '${portfolioId}'`]);
      }
      if(rows4[0]){
        const projectTrash = rows4[0];
        projectTrash?.map(async (row) => {
          const projectId = row.pid;
          await pool.execute("CALL DeleteProjectFiles(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectInvitedMembers(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectManagement(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectManagementFields(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectMembers(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectSuggestedMembers(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectHistory(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectRequestMember(?)", [`pid = '${projectId}'`]);
        })
        await pool.execute("CALL DeleteProject(?)", [`portfolio_id = '${portfolioId}'`]);
      }
      if(rows5[0]){
        const taskTrash = rows5[0];
        taskTrash?.map(async (row) => {
          const taskId = row.tid;
          await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${taskId}'`]);
        })
        await pool.execute("CALL DeleteTask(?)", [`portfolio_id = '${portfolioId}'`]);
      }
      if(rows6[0]){
        const subtaskTrash = rows6[0];
        subtaskTrash?.map(async (row) => {
          const subtaskId = row.stid;
          await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${subtaskId}'`]);
        })
        await pool.execute("CALL DeleteSubtask(?)", [`portfolio_id = '${portfolioId}'`]);
      }
      await pool.execute("CALL DeleteProjectPortfolioMember(?)", [`portfolio_id = '${portfolioId}'`]);
      await pool.execute("CALL DeleteProjectPortfolio(?)", [`portfolio_id = '${portfolioId}'`]);
    });

    goal_trash?.map(async (gl) => {
      const goalId = gl.gid; 
      const [rows1] = await pool.execute("CALL GoalsAllStrategiesList_to_delete(?)", [goalId]);
      if(rows1[0]){
        const strategyTrash = rows1[0];
        strategyTrash?.map(async (row) => {
          const strategyId = row.sid;
          const [rows1] = await pool.execute("CALL StrategyAllProjectsList_to_delete(?)", [strategyId]);
          if(rows1[0]){
            const projectTrash = rows1[0];
            projectTrash?.map(async (row) => {
              const projectId = row.pid;
              await pool.execute("CALL DeleteProjectFiles(?)", [`pid = '${projectId}'`]);
              await pool.execute("CALL DeleteProjectInvitedMembers(?)", [`pid = '${projectId}'`]);
              await pool.execute("CALL DeleteProjectManagement(?)", [`pid = '${projectId}'`]);
              await pool.execute("CALL DeleteProjectManagementFields(?)", [`pid = '${projectId}'`]);
              await pool.execute("CALL DeleteProjectMembers(?)", [`pid = '${projectId}'`]);
              await pool.execute("CALL DeleteProjectSuggestedMembers(?)", [`pid = '${projectId}'`]);
              await pool.execute("CALL DeleteProjectHistory(?)", [`pid = '${projectId}'`]);
              await pool.execute("CALL DeleteProjectRequestMember(?)", [`pid = '${projectId}'`]);

              const [row1] = await pool.execute("CALL getProjectAllTaskTrash(?)", [projectId]);
              if(row1[0]){
                const taskTrash = row1[0];
                taskTrash?.map(async (item) => {
                  const taskId = item.tid;
                  await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${taskId}'`]);
                })
                await pool.execute("CALL DeleteTask(?)", [`tproject_assign = '${projectId}'`]);
              }
              const [row2] = await pool.execute("CALL getProjectAllSubtaskTrash(?)", [projectId]);
              if(row2[0]){
                const subtaskTrash = row2[0];
                subtaskTrash?.map(async (item) => {
                  const subtaskId = item.stid;
                  await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${subtaskId}'`]);
                })
                await pool.execute("CALL DeleteSubtask(?)", [`stproject_assign = '${projectId}'`]);
              }
              await pool.execute("CALL DeleteProject(?)", [`pid = '${projectId}'`]);
            })
          }
          await pool.execute("CALL DeleteStrategies(?)", [`sid = '${strategyId}'`]);
        })
      }
      await pool.execute("CALL DeleteGoals(?)", [`gid = '${goalId}'`]);
    });

    strategy_trash?.map(async (kpi) => {
      const strategyId = kpi.sid;
      const [rows1] = await pool.execute("CALL StrategyAllProjectsList_to_delete(?)", [strategyId]);
      if(rows1[0]){
        const projectTrash = rows1[0];
        projectTrash?.map(async (row) => {
          const projectId = row.pid;
          await pool.execute("CALL DeleteProjectFiles(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectInvitedMembers(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectManagement(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectManagementFields(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectMembers(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectSuggestedMembers(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectHistory(?)", [`pid = '${projectId}'`]);
          await pool.execute("CALL DeleteProjectRequestMember(?)", [`pid = '${projectId}'`]);

          const [row1] = await pool.execute("CALL getProjectAllTaskTrash(?)", [projectId]);
          if(row1[0]){
            const taskTrash = row1[0];
            taskTrash?.map(async (item) => {
              const taskId = item.tid;
              await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${taskId}'`]);
            })
            await pool.execute("CALL DeleteTask(?)", [`tproject_assign = '${projectId}'`]);
          }
          const [row2] = await pool.execute("CALL getProjectAllSubtaskTrash(?)", [projectId]);
          if(row2[0]){
            const subtaskTrash = row2[0];
            subtaskTrash?.map(async (item) => {
              const subtaskId = item.stid;
              await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${subtaskId}'`]);
            })
            await pool.execute("CALL DeleteSubtask(?)", [`stproject_assign = '${projectId}'`]);
          }
          await pool.execute("CALL DeleteProject(?)", [`pid = '${projectId}'`]);
        })
      }
      await pool.execute("CALL DeleteStrategies(?)", [`sid = '${strategyId}'`]);
    })

    project_trash?.map(async (pj) => {
      const projectId = pj.pid;
      await pool.execute("CALL DeleteProjectFiles(?)", [`pid = '${projectId}'`]);
      await pool.execute("CALL DeleteProjectInvitedMembers(?)", [`pid = '${projectId}'`]);
      await pool.execute("CALL DeleteProjectManagement(?)", [`pid = '${projectId}'`]);
      await pool.execute("CALL DeleteProjectManagementFields(?)", [`pid = '${projectId}'`]);
      await pool.execute("CALL DeleteProjectMembers(?)", [`pid = '${projectId}'`]);
      await pool.execute("CALL DeleteProjectSuggestedMembers(?)", [`pid = '${projectId}'`]);
      await pool.execute("CALL DeleteProjectHistory(?)", [`pid = '${projectId}'`]);
      await pool.execute("CALL DeleteProjectRequestMember(?)", [`pid = '${projectId}'`]);

      const [row1] = await pool.execute("CALL getProjectAllTaskTrash(?)", [projectId]);
      if(row1[0]){
        const taskTrash = row1[0];
        taskTrash?.map(async (item) => {
          const taskId = item.tid;
          await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${taskId}'`]);
        })
        await pool.execute("CALL DeleteTask(?)", [`tproject_assign = '${projectId}'`]);
      }
      const [row2] = await pool.execute("CALL getProjectAllSubtaskTrash(?)", [projectId]);
      if(row2[0]){
        const subtaskTrash = row2[0];
        subtaskTrash?.map(async (item) => {
          const subtaskId = item.stid;
          await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${subtaskId}'`]);
        })
        await pool.execute("CALL DeleteSubtask(?)", [`stproject_assign = '${projectId}'`]);
      }
      await pool.execute("CALL DeleteProject(?)", [`pid = '${projectId}'`]);
    })

    task_trash?.map(async (tk) => {
      const taskId = tk.tid;
      await pool.execute("CALL DeleteSubtask(?)", [`tid = '${taskId}'`]);
      await pool.execute("CALL DeleteSubtaskTrash(?)", [`tid = '${taskId}'`]);
      await pool.execute("CALL DeleteTaskTrash(?)", [`tid = '${taskId}'`]);
      await pool.execute("CALL DeleteTask(?)", [`tid = '${taskId}'`]);
    })

    subtask_trash?.map(async (stk) => {
      const subtaskId = stk.stid;
      await pool.execute("CALL DeleteSubtaskTrash(?)", [`stid = '${subtaskId}'`]);
      await pool.execute("CALL DeleteSubtask(?)", [`stid = '${subtaskId}'`]);
    })

    projectFile_trash?.map(async (pft) => {
      const pfileId = pft.pfile_id;
      await pool.execute("CALL DeleteProjectFiles(?)", [`pfile_id = '${pfileId}'`]);
    })

    taskFile_trash?.map(async (tft) => {
      const trashId = tft.trash_id;
      await pool.execute("CALL DeleteTaskTrash(?)", [`trash_id = '${trashId}'`]);
    })

    subtaskFile_trash?.map(async (stft) => {
      const strashId = stft.strash_id;
      await pool.execute("CALL DeleteSubtaskTrash(?)", [`strash_id = '${strashId}'`]);
    })

    return res.status(200).json({ message: "Deleted permanently" });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
